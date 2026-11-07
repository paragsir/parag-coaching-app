/**
 * Helper to build free wa.me WhatsApp URLs with prefilled messages
 */

export function cleanIndianPhone(phone: string): string {
  // Strip non-digits
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return cleaned;
  }
  return `91${cleaned.slice(-10)}`;
}

export function buildWhatsAppUrl(phone: string, text: string): string {
  const formattedPhone = cleanIndianPhone(phone);
  const encoded = encodeURIComponent(text);
  return `https://wa.me/${formattedPhone}?text=${encoded}`;
}

export function getFeeReminderMessage(
  parentName: string,
  studentName: string,
  month: string,
  amount: number,
  dueDate: string,
  daysLate: number
): string {
  if (daysLate > 0) {
    return `Namaste ${parentName} ji,

This is an urgent reminder from Parag Coaching that ${studentName}'s tuition fee of ₹${amount} for ${month} is pending by ${daysLate} days (Due date: ${dueDate}).

Kindly clear the dues at the earliest via UPI to avoid disruption in classes.

UPI ID: pandeyakash09307@okhdfcbank
For any query, contact Akash Pandey.
- Parag Coaching`;
  }

  // 5th of month or general reminder
  return `Namaste ${parentName} ji,

Gentle reminder from Parag Coaching regarding ${studentName}'s tuition fee for ${month} (₹${amount}). 

Due Date: ${dueDate}
You can pay directly via UPI: pandeyakash09307@okhdfcbank

Thank you for your cooperation!
- Akash Pandey, Parag Coaching`;
}

export function getMonthEndFeeMessage(parentName: string, studentName: string): string {
  return `Namaste, ${parentName}, ${studentName} ki is mahine ki fees pending hai. Kripya jald jama kare - Parag Coaching`;
}

export function getAbsentAlertMessage(
  parentName: string,
  studentName: string,
  date: string,
  coachingPhone: string = '9839123456'
): string {
  return `Dear ${parentName},

Your child ${studentName} was marked ABSENT today (${date}) at Parag Coaching. 

Regular attendance is critical for board exam preparations. If this absence was planned, kindly notify us.

Contact: Akash Pandey (${coachingPhone})
- Parag Coaching`;
}

export function getWeeklyTestReportMessage(
  studentName: string,
  batch: string,
  testTitle: string,
  subject: string,
  marks: number,
  maxMarks: number,
  rank: number
): string {
  const percent = Math.round((marks / maxMarks) * 100);
  let remark = 'Excellent performance! Keep it up.';
  if (percent < 60) remark = 'Needs more revision and practice in this topic.';
  else if (percent < 80) remark = 'Good effort! Can aim for top ranks with regular problem solving.';

  return `📊 Parag Coaching - Weekly Test Report

Student: ${studentName}
Batch: ${batch}
Test: ${testTitle} (${subject})
Marks: ${marks} / ${maxMarks} (${percent}%)
Batch Rank: #${rank}
Mentor Feedback: ${remark}

Stay focused on daily revisions!
- Akash Pandey, Parag Coaching`;
}

export function getFeeReceiptMessage(
  receiptNumber: string,
  studentName: string,
  month: string,
  amount: number,
  paidDate: string,
  paymentMode: string = 'UPI'
): string {
  return `🧾 Parag Coaching - Official Fee Receipt

Receipt No: ${receiptNumber}
Date: ${paidDate}
Student Name: ${studentName}
Fee Period: ${month}
Amount Received: ₹${amount}
Payment Mode: ${paymentMode}
Status: VERIFIED & CLEARED

Thank you for the timely payment!
- Akash Pandey
Owner & Director, Parag Coaching`;
}
