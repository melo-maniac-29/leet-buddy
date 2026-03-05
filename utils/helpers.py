diff --git a/utils/helpers.py b/utils/helpers.py
index 0000000..1111111 100644
--- a/utils/helpers.py
+++ b/utils/helpers.py
@@ -1 +1,7 @@
-# Error: TypeError: unsupported operand type(s) for +: NoneType and str
+"""Helper function to safely concatenate strings."""
+def safe_concat(a, b):
+    try:
+        return (a or '') + (b or '')
+    except Exception as e:
+        return f"Error concatenating strings: {str(e)}"