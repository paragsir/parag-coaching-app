import React from 'react';
import { 
  X, 
  CheckCircle, 
  Printer, 
  Share2, 
  GraduationCap, 
  ExternalLink 
} from 'lucide-react';
import { FeeRecord, Student } from '../types';
import { useData } from '../context/DataContext';
import { buildWhatsAppUrl, getFeeReceiptMessage } from '../utils/whatsapp';

interface ReceiptModalProps {
  fee: FeeRecord;
  student?: Student;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ fee, student, onClose }) => {
  const { settings, students } = useData();
  const currentStudent = student || students.find((s) => s.id === fee.studentId);

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    if (!currentStudent?.whatsappNumber) return;
    const msg = getFeeReceiptMessage(
      fee.receiptNumber || 'PC-REC-AUTO',
      fee.studentName,
      fee.month,
      fee.amount,
      fee.paidAt || new Date().toISOString().split('T')[0],
      fee.paymentMode || 'UPI'
    );
    const url = buildWhatsAppUrl(currentStudent.whatsappNumber, msg);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-800/80 border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm text-white">Payment Receipt Cleared</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Paper */}
        <div className="p-6 bg-white text-slate-900 m-4 rounded-2xl shadow-inner relative overflow-hidden" id="receipt-printable">
          {/* Subtle Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
            <GraduationCap className="w-64 h-64 text-indigo-900" />
          </div>

          {/* Coaching Header */}
          <div className="text-center pb-4 border-b border-dashed border-slate-300">
            {settings.logoImageUrl && (
              <img
                src={settings.logoImageUrl}
                alt="Logo"
                className="w-11 h-11 object-cover rounded-xl mx-auto mb-2 border border-slate-300 shadow-sm"
              />
            )}
            <h2 className="text-xl font-extrabold tracking-tight text-indigo-900 font-['Outfit']">
              {settings.coachingName}
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              Academic Director: <span className="font-bold text-slate-800">{settings.ownerName}</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Phone: +91 {settings.phone} | {settings.address}
            </p>
            <div className="mt-2 inline-block px-3 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
              Official Tuition Fee Voucher
            </div>
          </div>

          {/* Receipt Meta */}
          <div className="grid grid-cols-2 gap-2 my-4 text-xs">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Receipt Number</p>
              <p className="font-bold text-slate-800">{fee.receiptNumber || 'PC-REC-2026-AUTO'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Payment Date</p>
              <p className="font-bold text-slate-800">{fee.paidAt || new Date().toISOString().split('T')[0]}</p>
            </div>
          </div>

          {/* Student Info Box */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 my-3 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Student Name:</span>
              <span className="font-bold text-slate-800">{fee.studentName}</span>
            </div>
            {currentStudent?.rollNo && (
              <div className="flex justify-between">
                <span className="text-slate-500">Roll Number:</span>
                <span className="font-semibold text-slate-700">{currentStudent.rollNo}</span>
              </div>
            )}
            {currentStudent?.class && (
              <div className="flex justify-between">
                <span className="text-slate-500">Class & Batch:</span>
                <span className="font-semibold text-slate-700">{currentStudent.class} • {currentStudent.batch}</span>
              </div>
            )}
            {currentStudent?.parentName && (
              <div className="flex justify-between">
                <span className="text-slate-500">Parent / Guardian:</span>
                <span className="font-semibold text-slate-700">{currentStudent.parentName}</span>
              </div>
            )}
          </div>

          {/* Fee Itemization Table */}
          <div className="my-3 border-t border-b border-slate-200 py-2.5 text-xs">
            <div className="flex justify-between font-semibold text-slate-600 mb-1">
              <span>Description</span>
              <span>Amount</span>
            </div>
            <div className="flex justify-between font-medium text-slate-800">
              <span>Tuition Fee ({fee.month})</span>
              <span>₹{fee.amount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 mt-0.5">
              <span>Payment Mode: {fee.paymentMode || 'UPI Instant'}</span>
              <span className="text-emerald-600 font-semibold">Status: Cleared</span>
            </div>
          </div>

          {/* Grand Total */}
          <div className="flex justify-between items-center text-sm font-extrabold text-slate-900 py-1">
            <span>TOTAL PAID:</span>
            <span className="text-base text-indigo-900">₹{fee.amount.toLocaleString('en-IN')}</span>
          </div>

          {/* Signature / Stamp */}
          <div className="mt-6 pt-3 border-t border-dashed border-slate-300 flex justify-between items-end text-[10px]">
            <div>
              <p className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-600 inline" /> Digitally Verified
              </p>
              <p className="text-slate-500">No physical signature required</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-800">{settings.ownerName}</p>
              <p className="text-slate-500">Authorized Signatory</p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-950 flex flex-col sm:flex-row gap-2 border-t border-slate-800">
          <button
            onClick={handleSendWhatsApp}
            disabled={!currentStudent?.whatsappNumber}
            className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" />
            <span>Send Receipt on WhatsApp</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>
      </div>
    </div>
  );
};
