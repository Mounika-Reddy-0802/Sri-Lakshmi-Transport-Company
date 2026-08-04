# Git & Version Control Rules

These rules apply to the entire project unless explicitly changed.

## One-time setup

```bash
git config --global user.name "Mounika-Reddy-0802"
git config --global user.email "sherymounikareddy.2006@gmail.com"

# remote (already configured; shown for reference)
git remote add origin https://github.com/Mounika-Reddy-0802/Sri-Lakshmi-Transport-Company.git
```

Always push using **my own GitHub repository and credentials**. Never suggest creating
another repository or using another account. Never change the remote unless I explicitly
ask. Assume the remote is already configured.

## Commit on every meaningful change

Every meaningful change must be committed and pushed. A meaningful change includes:
adding a feature, creating a file, deleting a file, refactoring, fixing a bug, updating
project structure, adding documentation, changing configuration, improving the UI, updating
the data/training pipeline, or implementing any roadmap milestone.

## Workflow (for every completed task)

1. Finish the implementation.
2. Verify the project still runs correctly.
3. Review the modified files.
4. Create a **small, focused commit** for only the related changes.
5. Push to the current branch on GitHub.
6. Then move on to the next task.

## Commit message rules

Write simple, natural, human commit messages. Keep them short, lowercase, clear, focused on
one change, and under ~50 characters when possible.

Good examples:

```
add project structure
create dataset loader
fix preprocessing bug
update training config
connect dashboard backend
add streamlit homepage
update readme
clean up imports
add evaluation script
fix dashboard layout
update requirements
remove unused files
```

Do **not** use AI-style messages such as: "implement comprehensive…", "refactor
architecture…", "introduce advanced…", "enhance robust…", "complete implementation of…",
"add extensive…", "improve overall…", "optimize pipeline…".

## Push rules

- Push to the current branch after every successful commit.
- Use my GitHub account and the already-configured remote.
