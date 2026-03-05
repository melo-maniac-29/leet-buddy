--- api/main.py
+++ api/main.py
@@ -1,3 +1,12 @@
-# Error: UnknownError: 
+from fastapi import FastAPI, HTTPException
+from database import db
+from models import Problem
+
+app = FastAPI()
+
+@app.get('/problems/{problem_id}')
+def get_problem(problem_id: int):
+    try:
+        problem = db.query(Problem).filter(Problem.problem_id == problem_id).first()
+        if not problem:
+            raise HTTPException(status_code=404, detail='Problem not found')
+        return problem
+    except Exception as e:
+        raise HTTPException(status_code=500, detail=f'Unknown error: {str(e)}')