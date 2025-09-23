# EMERGENCY: Clean Git History Commands

# WARNING: These commands will rewrite your entire git history

# Make sure you have new credentials from Firebase and Cloudinary first!

# Method 1: Remove specific sensitive files from ALL git history

git filter-branch --force --index-filter \
"git rm --cached --ignore-unmatch src/config/firebase.js src/config/cloudinary.js keys/nsfw-filter.json" \
--prune-empty --tag-name-filter cat -- --all

# Method 2: Remove any commit containing the exposed API key

git filter-branch --force --commit-filter \
'if git show $GIT_COMMIT | grep -q "AIzaSyAQcdcOEmLA4PEVWtcUM5ehTmP2zMkbdfM"; then
    skip_commit "$@";
else
git commit-tree "$@";
fi' HEAD

# After cleaning history, force push to GitHub

git push origin --force --all
git push origin --force --tags

# Clean up local references

rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive
