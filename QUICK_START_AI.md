# Quick Start Guide — AI Features Testing

## 🚀 Start the Application

```bash
# Terminal 1 - Backend
cd server
npm start
# Should show: Server running on port 5000

# Terminal 2 - Frontend
cd client
npm run dev
# Should show: Local: http://localhost:5173
```

---

## ⚙️ Setup OpenAI API Key

### Option 1: Use .env File (Recommended for Testing)

```bash
cd server
# Edit .env file and add:
OPENAI_API_KEY=sk-proj-your_actual_key_here
```

**Get your key from:** https://platform.openai.com/api-keys

### Option 2: Use UI (Per-Organization)

1. Log in as Organization Admin
2. Go to **Organization** → **AI Settings**
3. Paste your OpenAI key
4. Enable features: Email Composer, NL Search, Note Summarization
5. Click **Save Settings**

---

## 🧪 Test Each Feature (5 minutes)

### Test 1: AI Lead Scoring ✨ (No OpenAI needed)

1. Go to **Leads** page
2. Click **✨ Score All Leads** button (top toolbar)
3. Wait 2-3 seconds
4. See colored badges appear: 🔴 Hot / 🟡 Warm / 🔵 Cold

**Expected Result:** All leads now have AI scores displayed

---

### Test 2: AI Email Composer 📧 (OpenAI required)

1. Go to **Leads** page
2. Click **Edit** on any lead
3. Scroll to bottom of modal
4. Click **✨ Compose AI Email** button
5. Select Purpose: **Follow Up**
6. Select Tone: **Professional**
7. Click **Generate Email**
8. Wait 2-3 seconds

**Expected Result:** 
- Subject line appears
- Professional email body appears
- See "Copy" button to copy the text
- Token count shown at bottom

**Sample Output:**
```
Subject: Following Up on Our Conversation

Hi John,

I wanted to reach out following our recent discussion...
[AI-generated personalized content]

Best regards
```

---

### Test 3: Natural Language Search 🔍 (OpenAI required)

1. Click **AI Search** button in top header (violet button with sparkles)
2. Type: `"leads from tech companies worth over 10000"`
3. Click **Search**
4. Wait 2-3 seconds

**Expected Result:**
- Shows interpretation: "Filtered leads where value > $10,000"
- Lists matching leads
- Click any result to navigate to that lead

**Try These Queries:**
- "deals closing this month"
- "active customers who spent more than 5000"
- "high priority tasks due this week"

---

### Test 4: Deal Health Scores 💊 (No OpenAI needed)

1. Go to **Deals** page
2. Click **✨ Deal Health** button (top toolbar)
3. Wait 2-3 seconds

**Expected Result:**
- Health bars appear on each deal card
- Risk flags show: 🚩 stale, ⏰ overdue, 📧 no_contact
- Health scores: 0-100

---

### Test 5: AI Dashboard 🎯 (No OpenAI needed)

1. Click **AI Insights** in sidebar (violet icon)
2. See full AI dashboard with:
   - Daily briefing card
   - Lead score distribution chart
   - Top 10 next actions
   - Deal health summary
   - Revenue forecast chart
   - Customer churn warnings

**Expected Result:** Full AI overview of your CRM

---

### Test 6: Next Action Recommendations 🎬 (No OpenAI needed)

1. Go to **Leads** page
2. Click **Edit** on any lead
3. See blue banner at bottom: **AI Suggested Action**

**Expected Result:**
- Banner shows: "Make first contact" or "Send follow-up email"
- Action changes based on lead status

---

### Test 7: Churn Risk Detection ⚠️ (No OpenAI needed)

1. Go to **Customers** page
2. Click **✨ Churn Analysis** button
3. Wait 2-3 seconds

**Expected Result:**
- Risk badges appear: HIGH / MEDIUM / LOW
- Filter by risk level
- See at-risk customers highlighted

---

### Test 8: Revenue Forecast 📈 (No OpenAI needed)

1. Go to **Analytics** page (from sidebar)
2. Scroll to **Revenue Forecast** section

**Expected Result:**
- Chart shows next 3 months predicted revenue
- Confidence ranges shown
- Based on weighted pipeline deals

---

### Test 9: Daily Briefing 📰 (No OpenAI needed)

1. Go to **Dashboard Home**
2. See AI Briefing card at the top

**Expected Result:**
- Shows today's priorities
- Urgent tasks, deals closing, at-risk customers
- Refresh button to regenerate

---

### Test 10: Note Summarization 📝 (OpenAI required)

**Currently available via API only** (future: will be in entity detail pages)

```bash
# Test via curl (replace JWT_TOKEN and IDs)
curl -X POST http://localhost:5000/api/employee/ai/summarize-notes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entityType":"lead","entityId":1}'
```

**Expected Result:**
```json
{
  "summary": "Customer interested in enterprise plan...",
  "insights": ["High engagement", "Budget confirmed"],
  "recommendedAction": "Schedule demo call"
}
```

---

## ✅ Verification Checklist

After testing, verify:

- [ ] Lead scores appear on Leads page
- [ ] Email composer opens and generates emails
- [ ] AI Search button works in header
- [ ] AI Search parses queries correctly
- [ ] Deal health scores appear
- [ ] AI Dashboard loads with all widgets
- [ ] Next action banners appear in modals
- [ ] Churn risk badges appear on Customers
- [ ] Revenue forecast chart shows on Analytics
- [ ] Daily briefing card shows on Dashboard

---

## 🐛 Common Issues

### Issue 1: "OpenAI API key not configured"

**Fix:** 
```bash
# Edit server/.env
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE

# Restart server
# Press Ctrl+C in Terminal 1, then npm start again
```

### Issue 2: AI Search button not visible

**Fix:** The button is hidden on small screens. Resize browser window or check on tablet/desktop viewport.

### Issue 3: Email composer returns error

**Fix:**
1. Check API key is valid
2. Check you have credits in OpenAI account
3. Check server logs for detailed error

### Issue 4: Note summarization says "not enough notes"

**Fix:** Entity needs at least 3 notes. Add more notes to the lead/customer/deal first.

---

## 💡 Pro Tips

1. **Cost Tracking:** Go to **Organization** → **AI Settings** to see token usage this month

2. **Disable Features:** Org admin can toggle individual features on/off in AI Settings

3. **Better Email Results:** More entity data (notes, activities) = better AI emails

4. **Natural Language Search:** Be specific! 
   - ✅ "leads from tech companies worth over 10000"
   - ❌ "good leads"

5. **Token Limits:** Set monthly token limit in AI Settings to prevent overspending

---

## 📊 Expected Performance

| Feature | Response Time | Tokens Used | Cost per Call |
|---------|--------------|-------------|---------------|
| Lead Scoring | < 1s | 0 (rule-based) | $0 |
| Email Composer | 2-4s | ~500 | ~$0.002 |
| NL Search | 2-3s | ~200 | ~$0.001 |
| Note Summary | 2-4s | ~800 | ~$0.003 |
| Deal Health | < 1s | 0 (rule-based) | $0 |
| Churn Risk | < 1s | 0 (rule-based) | $0 |

---

## 🎉 You're All Set!

All AI features are working. Enjoy your AI-powered CRM! 🚀

**Questions?** Check:
- `AI_IMPLEMENTATION_PLAN.md` — Full implementation details
- `AI_OPENAI_FEATURES_COMPLETE.md` — OpenAI features documentation
- `IMPLEMENTATION_COMPLETE.md` — Traditional CRM features

---

**Last Updated:** August 30, 2026
