import httpx
import json
import base64
from typing import Dict, Any
import os
from datetime import datetime


class GitHubService:
    def __init__(self, client_id: str, client_secret: str, repo_owner: str, repo_name: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.repo_owner = repo_owner
        self.repo_name = repo_name
        self.api_base = "https://api.github.com"
        # Optional: Only needed for backend PR creation (users create PRs via extension)
        self.github_token = os.getenv("GITHUB_ACCESS_TOKEN")
    
    async def create_contribution_pr(
        self,
        problem_id: int,
        problem_title: str,
        language: str,
        code: str,
        contributor_github: str,
        runtime: str = None,
        memory: str = None
    ) -> Dict[str, Any]:
        """
        Create a Pull Request for a new solution contribution
        Real implementation using GitHub API
        """
        if not self.github_token:
            raise Exception("GitHub access token not configured. Set GITHUB_ACCESS_TOKEN in .env")
        
        try:
            async with httpx.AsyncClient() as client:
                # 1. Get main branch SHA
                branch_response = await client.get(
                    f"{self.api_base}/repos/{self.repo_owner}/{self.repo_name}/git/refs/heads/main",
                    headers={
                        "Authorization": f"token {self.github_token}",
                        "Accept": "application/vnd.github.v3+json"
                    }
                )
                branch_response.raise_for_status()
                main_sha = branch_response.json()["object"]["sha"]
                
                # 2. Create new branch
                branch_name = f"contrib-{language.lower()}-{problem_id}-{int(datetime.now().timestamp())}"
                create_branch_response = await client.post(
                    f"{self.api_base}/repos/{self.repo_owner}/{self.repo_name}/git/refs",
                    headers={
                        "Authorization": f"token {self.github_token}",
                        "Accept": "application/vnd.github.v3+json"
                    },
                    json={
                        "ref": f"refs/heads/{branch_name}",
                        "sha": main_sha
                    }
                )
                create_branch_response.raise_for_status()
                
                # 3. Get current final_database.json
                db_response = await client.get(
                    f"{self.api_base}/repos/{self.repo_owner}/{self.repo_name}/contents/processed-data/final_database.json",
                    headers={
                        "Authorization": f"token {self.github_token}",
                        "Accept": "application/vnd.github.v3+json"
                    },
                    params={"ref": branch_name}
                )
                db_response.raise_for_status()
                db_data = db_response.json()
                
                # Decode current database
                current_db = json.loads(base64.b64decode(db_data["content"]).decode('utf-8'))
                
                # 4. Add new solution to database
                problem_found = False
                for problem in current_db["problems"]:
                    if problem["problem_id"] == problem_id:
                        if "solutions" not in problem:
                            problem["solutions"] = {}
                        if language.lower() not in problem["solutions"]:
                            problem["solutions"][language.lower()] = []
                        
                        problem["solutions"][language.lower()].append({
                            "code": code,
                            "source": "community",
                            "language": language,
                            "contributor": contributor_github,
                            "contributed_at": datetime.now().isoformat(),
                            "runtime": runtime,
                            "memory": memory
                        })
                        problem_found = True
                        break
                
                if not problem_found:
                    raise Exception(f"Problem #{problem_id} not found in database")
                
                # Update metadata
                current_db["metadata"]["last_updated"] = datetime.now().strftime("%Y-%m-%d")
                
                # 5. Commit updated database to branch
                updated_content = json.dumps(current_db, indent=2, ensure_ascii=False)
                commit_response = await client.put(
                    f"{self.api_base}/repos/{self.repo_owner}/{self.repo_name}/contents/processed-data/final_database.json",
                    headers={
                        "Authorization": f"token {self.github_token}",
                        "Accept": "application/vnd.github.v3+json"
                    },
                    json={
                        "message": f"Add {language} solution for Problem #{problem_id}: {problem_title}\n\nContributed by @{contributor_github}",
                        "content": base64.b64encode(updated_content.encode('utf-8')).decode('utf-8'),
                        "branch": branch_name,
                        "sha": db_data["sha"]
                    }
                )
                commit_response.raise_for_status()
                
                # 6. Create pull request
                pr_response = await client.post(
                    f"{self.api_base}/repos/{self.repo_owner}/{self.repo_name}/pulls",
                    headers={
                        "Authorization": f"token {self.github_token}",
                        "Accept": "application/vnd.github.v3+json"
                    },
                    json={
                        "title": f"Add {language} solution for Problem #{problem_id}: {problem_title}",
                        "head": branch_name,
                        "base": "main",
                        "body": self._generate_pr_body(problem_id, problem_title, language, runtime, memory, contributor_github)
                    }
                )
                pr_response.raise_for_status()
                pr_data = pr_response.json()
                
                return {
                    "number": pr_data["number"],
                    "url": pr_data["html_url"],
                    "title": pr_data["title"],
                    "branch": branch_name
                }
                
        except httpx.HTTPStatusError as e:
            raise Exception(f"GitHub API error: {e.response.status_code} - {e.response.text}")
        except Exception as e:
            raise Exception(f"Failed to create PR: {str(e)}")
    
    def _generate_pr_body(
        self,
        problem_id: int,
        problem_title: str,
        language: str,
        runtime: str,
        memory: str,
        contributor: str
    ) -> str:
        """Generate PR description"""
        body = f"""## 🎉 New Solution Contribution

**Problem:** [#{problem_id}: {problem_title}](https://leetcode.com/problems/{problem_title.lower().replace(' ', '-')}/)
**Language:** {language}
**Contributor:** @{contributor}

### Performance Metrics
"""
        if runtime:
            body += f"- **Runtime:** {runtime}\n"
        if memory:
            body += f"- **Memory:** {memory}\n"
        
        body += """
### Contribution Details
- ✅ Solution verified on LeetCode
- ✅ Automated PR created via LeetBuddy extension
- ✅ Ready for review

---
*This PR was automatically generated by [LeetBuddy](https://github.com/yourusername/leet-buddy) 🚀*
"""
        return body
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Get GitHub user information"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/user",
                headers={
                    "Authorization": f"token {access_token}",
                    "Accept": "application/vnd.github.v3+json"
                }
            )
            response.raise_for_status()
            return response.json()
