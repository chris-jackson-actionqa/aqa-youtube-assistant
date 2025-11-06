# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e4]:
      - generic [ref=e6]: YouTube Assistant
      - 'button "Current workspace: test-workspace-c80808d1-e9fe-4168-838d-b73bb17a8c4f" [ref=e9]':
        - img [ref=e10]
        - generic [ref=e12]: test-workspace-c80808d1-e9fe-4168-838d-b73bb17a8c4f
        - img [ref=e13]
  - main [ref=e15]:
    - main [ref=e17]:
      - generic [ref=e18]:
        - heading "YouTube Assistant" [level=1] [ref=e19]
        - paragraph [ref=e20]: Helper for planning and making YouTube videos for the ActionaQA channel
      - generic [ref=e21]:
        - heading "Create New Project" [level=2] [ref=e22]
        - button "Create new project" [ref=e23]: + Create New Project
      - generic [ref=e24]:
        - heading "Your Projects" [level=2] [ref=e25]
        - list "Projects" [ref=e27]:
          - button "Select project Persistent Project" [ref=e28] [cursor=pointer]:
            - generic [ref=e29]:
              - heading "Persistent Project" [level=3] [ref=e30]
              - 'generic "Status: Planned" [ref=e31]': Planned
            - generic [ref=e32]:
              - paragraph [ref=e33]:
                - text: "Created:"
                - time [ref=e34]: 11/06/2025
              - paragraph [ref=e35]:
                - text: "Updated:"
                - time [ref=e36]: 11/06/2025
            - button "Delete project Persistent Project" [ref=e38]:
              - img [ref=e39]
  - alert [ref=e41]
```