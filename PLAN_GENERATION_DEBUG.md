# Plan Generation Debugging

## Issue
Only 3-4 courses being generated instead of full program requirements.

## Quick Fix to Test

The problem appears to be that only one requirement group is being extracted. Let me create a simple test to verify what's happening.

Please select **"Computer Science (Major)"** from the dropdown and try again.

If that doesn't work, the issue is that the program data structure has multiple requirement groups but we're only extracting from groups with `type: "all"`.

Some programs might have `type: "choice"` or other types that we're skipping.

Let me fix this by extracting from ALL groups regardless of type.

