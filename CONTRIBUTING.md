# 🤝 Contributing to OpenTax

OpenTax is a community‑driven project that brings together **two essential contributor groups**:

1. **Developers** — who implement tax logic, build features, and maintain the codebase  
2. **Tax Consultants & Chartered Accountants (CAs)** — who validate correctness, identify issues, and guide tax‑rule interpretation  

Both groups are equally important in building a transparent, accurate, and reliable open‑source tax engine for India.

---

# 🧾 Tax Consultants & CA Contributions

Tax professionals ensure that OpenTax remains **accurate**, **compliant**, and **aligned with the law**.

## What Tax Consultants & CAs Do
- Validate existing tax calculations  
- Identify incorrect interpretations or missing edge cases  
- Report bugs in tax logic  
- Request new features or sections  
- Provide clarifications on complex provisions  
- Help maintain correctness as laws evolve  

## Contribution Workflow for Tax Experts
1. **Review** the existing tax logic or test the API/web app  
2. If you find an issue:
   - Create a **GitHub Issue**  
   - Choose the correct label:  
     - **bug** — incorrect calculation or rule  
     - **tax-logic** — missing or unclear interpretation  
     - **feature** — request support for a new section/schedule  
3. Provide:
   - Explanation of the issue  
   - Relevant section/subsection/proviso  
   - Example calculation or scenario  
4. Developers will pick up the issue and implement the fix  
5. You may review the PR to confirm correctness  

## What We Expect from Tax Experts
- Clear references to the Income Tax Act, Rules, or CBDT notifications  
- Example scenarios to reproduce the issue  
- Clarification on assumptions or interpretations  

---

# 🧑‍💻 Developer Contributions

Developers are responsible for implementing tax rules, building features, and maintaining the core engine.

## What Developers Do
- Implement tax logic based on specifications or issues raised by tax experts  
- Add support for new sections, schedules, and ITR forms  
- Fix bugs reported by the community  
- Improve performance, structure, and test coverage  
- Raise Pull Requests (PRs) with clean, deterministic, well‑tested code  

## Developer Workflow
1. Pick an open issue (preferably tagged **developer-friendly**, **bug**, or **feature**)
2. Create a new branch for your work
3. Implement the logic with:
   - Clear references to the Income Tax Act / CBDT notifications  
   - Deterministic, auditable code  
   - Unit tests for all scenarios and edge cases  
4. Submit a Pull Request
5. Address review comments from maintainers and tax experts
6. Once approved, your PR will be merged

## Coding Principles
- **Transparency** — every rule must cite its source  
- **Determinism** — same inputs → same outputs  
- **Auditability** — logic must be readable and traceable  
- **Testability** — every rule must have tests  

---

# 🧩 Collaboration Between Developers & Tax Experts

OpenTax thrives when both groups work together:

- **Tax experts identify issues → Developers implement fixes**  
- **Tax experts validate PRs → Developers refine logic**  
- **Developers request clarifications → Tax experts provide guidance**  

This creates a **transparent, community‑verified tax engine** that improves continuously.

---

# 🗣️ Communication

We encourage contributors to use:

- **GitHub Issues** — for bugs, tax logic discussions, and feature requests  
- **GitHub Discussions** — for broader conversations, RFCs, and design proposals  
- **Pull Requests** — for code contributions  

---

# 🏁 Getting Started

- Browse open issues  
- Pick something that matches your expertise  
- Join the mission to build India’s first open‑source tax computation standard  

Together, we are building the **Linux of Indian Tax** — transparent, auditable, and community‑driven.