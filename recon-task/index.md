---
title: A sample benchmark for finance and accounting AI
kicker: Prototype
lead: Three reconciliation tasks, built from the kind of work I did as a site accountant, with one correct answer each and a fixed grading sheet, so two reviewers reach the same score.
description: A sample finance and accounting benchmark by Ayush Dewangan, with fictional data, an answer key and results from testing three AI models.
---

Everything on this page is fictional. The companies, vendors, contractors and figures are invented, and nothing comes from any employer or client. Tax rates and thresholds are written into a policy sheet as task rules, so the right answer does not depend on outside law.

## The three tasks

1. **What do we owe a cement vendor?** A purchase order, three goods received notes, four invoices, a ledger and a bank statement. Four planted problems: a duplicate invoice, a rate above the purchase order, a short delivery billed in full, and a payment posted to the wrong vendor. One figure is the answer.
2. **A contractor's running bill.** The bill overclaims quantity and rate, applies the wrong TDS rate, and misses a free-issue material recovery and an advance recovery. The model has to work across the work order, the measurement book and the material register.
3. **A second contractor bill, with harder rules.** An extra item with no variation order, a measured quantity below the claim, liquidated damages that depend on completed weeks of delay, and a TDS rule that applies to the whole year's total once a threshold is crossed. It also contains a discount that must *not* be applied.

## How it is graded

Each task has a set of pass or fail checks (18 in all), and every check has one right answer. A task counts as correct only if its final figure matches to the rupee. The answer key is a spreadsheet with live formulas, so anyone can audit the derivation.

RESULTS_PLACEHOLDER

## Files

- [Task pack (Excel)]({{ '/files/Recon_Benchmark_Task_Pack.xlsx' | relative_url }}): policy, documents for all three tasks, and the prompt.
- [Prompt as plain text]({{ '/files/Recon_Benchmark_Prompt.md' | relative_url }}): paste it into any chatbot.
- [Answer key and grading sheet (Excel)]({{ '/files/Recon_Benchmark_Answer_Key.xlsx' | relative_url }}): worked figures with formulas, and the 18 checks.

A real benchmark would keep its answer key private. This one is a public sample of how I design tasks, so the key is open.
