---
title: A sample benchmark for finance and accounting AI
kicker: Prototype
lead: Reconciliation tasks built from the kind of work I did as a site accountant, with one correct answer each and a fixed grading sheet, so two reviewers reach the same score. Tested on four AI setups, and honest about the fact that none of them failed.
description: A sample finance and accounting benchmark by Ayush Dewangan, with fictional data, an answer key and results from testing Claude models on a standard and a hard-mode version.
---

Everything on this page is fictional. The companies, vendors, contractors and figures are invented, and nothing comes from any employer or client. Tax rates and thresholds are written into a policy sheet as task rules, so the right answer does not depend on outside law.

## The three tasks

1. **What do we owe a cement vendor?** A purchase order, three goods received notes, four invoices, a ledger and a bank statement. Four planted problems: a duplicate invoice, a rate above the purchase order, a short delivery billed in full, and a payment posted to the wrong vendor. One figure is the answer.
2. **A contractor's running bill.** The bill overclaims quantity and rate, applies the wrong TDS rate, and misses a free-issue material recovery and an advance recovery. The model has to work across the work order, the measurement book and the material register.
3. **A second contractor bill, with harder rules.** An extra item with no variation order, a measured quantity below the claim, liquidated damages that depend on completed weeks of delay, and a TDS rule that applies to the whole year's total once a threshold is crossed. It also contains a discount that must *not* be applied.

## How it is graded

Each task has a set of pass or fail checks (18 in all), and every check has one right answer. A task counts as correct only if its final figure matches to the rupee. The answer key is a spreadsheet with live formulas, so anyone can audit the derivation.

## Results

I ran the full prompt on three AI models (Claude Opus, Sonnet and Haiku), each as a separate fresh run with only the prompt, no answer key, no tools and no code, then graded each answer against the key myself.

| Model | Task 1 | Task 2 | Task 3 | Total |
|---|---|---|---|---|
| Claude Opus | 6 of 6 | 6 of 6 | 6 of 6 | 18 of 18 |
| Claude Sonnet | 6 of 6 | 6 of 6 | 6 of 6 | 18 of 18 |
| Claude Haiku | 6 of 6 | 6 of 6 | 6 of 6 | 18 of 18 |

An earlier version with only the first two tasks also scored 12 of 12 on all three models, which is why I added the third.

**What I take from this.** The answer key is sound: I computed every figure separately in code, and three independent solvers reached the same numbers. But these tasks are not hard for current models when the rules are written out and the documents are clean.

## Hard mode: a 253-line bank reconciliation

So I built a harder version. It is a month-end bank reconciliation with a cash book of 126 entries and a bank statement of 127 lines, 13 planted reconciling items, and traps that are not errors: payments of the same amount to different payees that must *not* be treated as duplicates. The planted items are three outstanding cheques, a stale cheque from the opening position, two deposits in transit, bank charges and interest, a direct debit, an unrecorded customer credit, a dishonoured cheque, a transposition error, and a bank error where one transfer was debited twice. The model must find all of them, decide which side each belongs on, and reach one adjusted balance (Rs 30,82,247) that both the cash book and the bank statement agree on.

I ran it blind as before: a fresh run per model, only the prompt, then graded against the key (10 checks, and the task counts as correct only if the final balance matches to the rupee).

| Condition | Result | Final balance |
|---|---|---|
| Claude Opus, no code | 10 of 10 | correct |
| Claude Sonnet, no code | 10 of 10 | correct |
| Claude Haiku, no code | 10 of 10 | correct |
| Claude Sonnet, with code on the two CSV files | 10 of 10 | correct |

"No code" means the model could not run any calculation, but each run had extended reasoning switched on (roughly 6,000 to 19,000 reasoning tokens), which is a real advantage over a chatbot answering in one pass. I have not tested ChatGPT or Gemini.

**What I take from this.** I expected the longer ledger to break at least one model. It did not. Length and arithmetic are not where current Claude models fail on written-rule reconciliation: all four runs found every planted item, avoided the false duplicates, and reached the right balance. Two of the four also flagged the one place a reviewer could disagree (whether the Rs 540 difference on cheque 004498 is a cash book error or a bank error), and said how the answer would change. So the next version cannot just be bigger. It has to depend on rules that are not written in the prompt, such as treatment under Indian tax law or company policy, or on judgement calls graded against a rubric, because that is where I would expect the models to diverge. I would rather publish this result than claim a failure I did not observe.

**Known issue in hard mode.** Cheque 004498 shows Rs 45,280 in the cash book and Rs 45,820 on the bank statement, a gap of Rs 540. The answer key treats this as a cash book error, because a bank pays the amount written on the cheque. The prompt does not say so, and no cheque image is provided. Two of the four runs noticed this and said the adjusted balance would be Rs 30,82,787 if the bank were at fault instead. A reviewer could defend that reading, so this task does not yet have exactly one correct answer. The fix is one added rule stating which record is authoritative. I have not changed the files, because the results above were produced with this version.

## Files

- [Task pack (Excel)]({{ '/files/Recon_Benchmark_Task_Pack.xlsx' | relative_url }}): policy, documents for all three tasks, and the prompt.
- [Prompt as plain text]({{ '/files/Recon_Benchmark_Prompt.md' | relative_url }}): paste it into any chatbot.
- [Answer key and grading sheet (Excel)]({{ '/files/Recon_Benchmark_Answer_Key.xlsx' | relative_url }}): worked figures with formulas, and the 18 checks.
- [Hard mode task pack (Excel)]({{ '/files/Recon_Hard_Mode_Task_Pack.xlsx' | relative_url }}): the cash book, bank statement, rules and questions.
- [Hard mode prompt as plain text]({{ '/files/Recon_Hard_Mode_Prompt.md' | relative_url }}): paste it into any chatbot, then compare with the key.
- [Hard mode answer key and grading sheet (Excel)]({{ '/files/Recon_Hard_Mode_Key.xlsx' | relative_url }}): the 13 reconciling items with formulas, and the 10 checks.

A real benchmark would keep its answer key private. This one is a public sample of how I design tasks, so the key is open.
