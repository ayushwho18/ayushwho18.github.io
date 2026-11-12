---
title: "I tried to make AI fail a bank reconciliation. It didn't."
category: analysis
summary: "I built a 253-line month-end bank reconciliation with 13 planted items and traps, expecting at least one model to break. All four runs got it right. Here is what that does and does not tell a finance team."
---

**In one line:** I built a reconciliation test hard enough that I expected AI models to fail it. None did, and that result is more useful than the failure I was hoping for.

<!--more-->

Before my MBA I kept the books for a construction project: vendor invoices, contractor bills, payments and reconciliations. That is exactly the work AI is now being sold to do. So I wrote a [sample benchmark]({{ '/recon-task/' | relative_url }}) to see how well it actually does it. All the data is fictional, and the rules are written into a policy sheet so that each task has one right answer.

## The test

The first version had three tasks: what a company owes a cement vendor, and two contractor running bills with TDS, retention, recoveries and liquidated damages. Each task had pass or fail checks, 18 in all. Claude Opus, Sonnet and Haiku all scored 18 of 18.

So I made it harder. The hard-mode task is a month-end bank reconciliation: a cash book of 126 entries, a bank statement of 127 lines, and 13 planted reconciling items. They include outstanding cheques, deposits in transit, a dishonoured cheque, a transposition error and a transfer the bank debited twice. It also has traps that are not errors, such as two payments of the same amount to different payees, which must not be treated as duplicates. Both sides have to agree on one adjusted balance.

## What happened

I ran four separate, fresh attempts: Opus, Sonnet and Haiku with no code, and Sonnet again with code on the two files. I graded each one against the key. All four found every planted item, avoided the false duplicates and reached the right balance. I had expected the longer ledger to break at least one of them. It did not.

Two caveats matter. The no-code runs had extended reasoning switched on, which is an advantage over a chatbot answering in one pass. And I have only tested Claude models, not ChatGPT or Gemini.

## The flaw in my own key

Two of the four runs flagged a weak spot in my own key. One cheque appears as Rs 45,280 in the cash book and Rs 45,820 on the bank statement. My key treats the gap as a cash book error, because a bank pays the amount written on the cheque. But the prompt never says so, and a reviewer could defend the other reading. So the task does not yet have exactly one correct answer. I have [published that note]({{ '/recon-task/' | relative_url }}#hard-mode-a-253-line-bank-reconciliation) rather than quietly fixing the file, because the results were produced with this version.

## What this tells a finance team

- When the rules are written down and the documents are clean, current models handle long reconciliations well. Length and arithmetic are not the weak point.
- The weak point is likely to be rules that are *not* written down: how Indian tax law treats an item, what the company's own policy is, and judgement calls a reviewer has to grade.
- A good test has to be checked for ambiguity before anyone trusts its score. Two of the models flagged the gap in mine.

The next version will test exactly that: unwritten rules and judgement, graded against a rubric. The task packs, prompts and answer keys are [open to download]({{ '/recon-task/' | relative_url }}#files) if you want to run them on another model.
