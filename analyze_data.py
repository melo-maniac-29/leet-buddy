import json

# Load database
with open('processed-data/final_database.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

problems = data['problems']

print(f"Total Problems: {len(problems)}\n")

# Count topics (problems can have multiple topics)
topic_counts = {}
for problem in problems:
    topics = problem.get('topics', [])
    for topic in topics:
        topic_counts[topic] = topic_counts.get(topic, 0) + 1

print("=== TOPIC COUNTS (Problems can be in multiple topics) ===")
for topic, count in sorted(topic_counts.items(), key=lambda x: -x[1])[:20]:
    print(f"{topic}: {count} problems")

# Verify Array problems
array_problems = [p for p in problems if 'Array' in p.get('topics', [])]
print(f"\n=== ARRAY PROBLEMS VERIFICATION ===")
print(f"Total problems with 'Array' topic: {len(array_problems)}")
print(f"First 5 Array problems:")
for i, p in enumerate(array_problems[:5]):
    print(f"  {i+1}. #{p['id']} - {p['title']} - Topics: {p.get('topics', [])}")

# Check if there are duplicate IDs
all_ids = [p['id'] for p in problems]
unique_ids = set(all_ids)
print(f"\n=== UNIQUENESS CHECK ===")
print(f"Total problem entries: {len(all_ids)}")
print(f"Unique problem IDs: {len(unique_ids)}")
print(f"Duplicates: {len(all_ids) - len(unique_ids)}")

# Count roadmaps
roadmap_counts = {}
for problem in problems:
    roadmaps = problem.get('roadmaps', [])
    for roadmap in roadmaps:
        roadmap_counts[roadmap] = roadmap_counts.get(roadmap, 0) + 1

print(f"\n=== ROADMAP COUNTS ===")
if roadmap_counts:
    for roadmap, count in sorted(roadmap_counts.items(), key=lambda x: -x[1]):
        print(f"{roadmap}: {count} problems")
else:
    print("No roadmaps found")

# Problems with roadmaps
problems_with_roadmaps = [p for p in problems if p.get('roadmaps')]
print(f"\nProblems with at least one roadmap: {len(problems_with_roadmaps)}")
print(f"Problems without roadmaps: {len(problems) - len(problems_with_roadmaps)}")
