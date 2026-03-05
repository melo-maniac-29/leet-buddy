--- api/main.py
+++ api/main.py
@@ -1,4 +1,22 @@
-# Error: ServerSelectionTimeoutError: connection refused to MongoDB at 127.0.0.1:27017
+from pymongo import MongoClient, errors
+
+"""Health check endpoint"""
+def check_mongo_connection():
+    try:
+        client = MongoClient("mongodb://127.0.0.1:27017", serverSelectionTimeoutMS=3000)
+        # Trigger a server selection to verify connection
+        client.admin.command('ping')
+        return {"status": "healthy", "database": "connected"}
+    except errors.ServerSelectionTimeoutError as e:
+        return {"status": "unhealthy", "error": str(e)}
+    finally:
+        client.close()
+
+# Example usage in FastAPI endpoint
+from fastapi import FastAPI
+app = FastAPI()
+
+@app.get("/health/mongo")
+def health():
+    return check_mongo_connection()