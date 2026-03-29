import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AlertCircle, Copy, CheckCircle2 } from 'lucide-react';

export default function BoletoOnline() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadBoleto() {
      if (!id) return setError('Link inválido.');
      
      try {
        const { data: res, error: rpcError } = await supabase.rpc('obter_carne_publico', { p_id: id });
        
        if (rpcError) throw rpcError;
        if (!res || !res.payment) throw new Error('Boleto não encontrado no sistema.');

        setData(res);
      } catch (err) {
        console.error(err);
        setError('Boleto indisponível no momento ou excluído pele secretaria.');
      } finally {
        setLoading(false);
      }
    }
    loadBoleto();
  }, [id]);

  const handleCopy = () => {
    if (data?.payment?.mp_qr_code) {
      navigator.clipboard.writeText(data.payment.mp_qr_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-azul-escuro"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-black text-azul-escuro mb-2">Ops! Houve um problema.</h2>
        <p className="text-gray-500 text-sm max-w-sm">{error}</p>
        <p className="text-gray-400 text-xs mt-6">Por favor, contate a secretaria do Instituto Canaã para emitir uma nova via.</p>
      </div>
    );
  }

  const { payment, student } = data;
  const isPaid = payment.pago;
  const isLate = !isPaid && new Date(payment.vencimento) < new Date(new Date().setHours(0,0,0,0));

  // Formatação de Datas e Valores seguras
  const valorFormatado = Number(payment.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const vencFormatado = payment.vencimento ? payment.vencimento.split('-').reverse().join('/') : `${payment.mes}/${payment.ano}`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 font-sans print:bg-white print:py-0">
      
      {/* Container Principal do Carnê */}
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden print:shadow-none print:rounded-none">
        
        {/* Cabeçalho */}
        <div className="bg-azul-escuro p-6 text-center text-white relative">
          <img src="https://i.ibb.co/XZ42Xw34/branca.png" alt="Logo" className="w-20 h-20 object-contain mx-auto mb-1 drop-shadow-sm" />
          <h1 className="text-lg font-black tracking-tight uppercase">Instituto Canaã</h1>
          <p className="text-[10px] text-white/70 font-medium tracking-widest uppercase mt-1">Gestão de Projetos</p>
          
          {/* Badge de Status */}
          <div className="absolute top-4 right-4">
            {isPaid ? (
              <span className="bg-emerald-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                <CheckCircle2 size={12} /> Pago
              </span>
            ) : isLate ? (
              <span className="bg-red-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-lg">
                Vencido
              </span>
            ) : (
              <span className="bg-amarelo-canaa text-gray-900 text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-lg">
                Pendente
              </span>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Dados Pessoais */}
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div className="col-span-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pagador / Responsável</p>
              <p className="text-sm font-black text-azul-escuro">{student?.resp || 'Não Informado'}</p>
              <p className="text-xs text-gray-500 line-clamp-1">{student?.cpf ? `CPF: ${student.cpf}` : ''}</p>
            </div>
            <div className="col-span-2 border-t border-gray-200 mt-2 pt-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Beneficiário (Aluno)</p>
              <p className="text-sm font-bold text-gray-700">{student?.nome || payment.aluno_nome}</p>
            </div>
          </div>

          {/* Dados Financeiros */}
          <div className="flex items-center justify-between border-b 1 border-gray-100 pb-4">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Vencimento</p>
              <p className={`text-xl font-black ${isLate && !isPaid ? 'text-red-500' : 'text-gray-800'}`}>
                {vencFormatado}
              </p>
              <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase mt-1">Ref: {payment.mes}/{payment.ano}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Valor do Boleto</p>
              <p className="text-2xl font-black text-emerald-600">{valorFormatado}</p>
            </div>
          </div>

          {/* Área do PIX */}
          {!isPaid && payment.mp_qr_code_64 ? (
            <div className="bg-[#f0fdf4] border border-emerald-100 p-5 rounded-2xl text-center space-y-4 no-print">
              <div className="inline-block bg-white p-2 rounded-xl shadow-sm border border-emerald-50">
                <img src={`data:image/png;base64,${payment.mp_qr_code_64}`} alt="QR Code Pix" className="w-40 h-40 object-contain mx-auto mix-blend-multiply" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-800 mb-2">Escaneie o QR Code ou utilize a chave Copia e Cola abaixo:</p>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={payment.mp_qr_code}
                    className="w-full bg-white border border-emerald-200 text-gray-500 text-[10px] py-3 px-3 min-h-[50px] rounded-xl outline-none truncate pr-14"
                  />
                  <button 
                    onClick={handleCopy}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg p-2 transition-all shadow-sm"
                    title="Copiar PIX"
                  >
                    {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                {copied && <p className="text-[10px] font-bold text-emerald-600 mt-2 animate-pulse">Código Copiado! Cole no aplicativo do seu banco.</p>}
              </div>
            </div>
          ) : !isPaid && !payment.mp_qr_code_64 ? (
             <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-center">
               <p className="text-xs text-amber-700 font-bold">O PIX automático não foi gerado para esta fatura. Por favor, transfira para a chave CNPJ da escola: 16.789.671/0001-13.</p>
             </div>
          ) : null}

          {isPaid && (
            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl text-center">
               <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-3" />
               <p className="text-sm font-black text-emerald-900">Boleto Pago!</p>
               <p className="text-xs text-emerald-700 mt-1">Agradecemos o seu pagamento.</p>
               {payment.data_pagamento && (
                 <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-3">Registrado em: {payment.data_pagamento.split('-').reverse().join('/')}</p>
               )}
            </div>
          )}

        </div>


      </div>
      
      {/* Footer minimalista fora do card */}
      <div className="mt-6 mb-6 text-center text-[10px] text-gray-400 uppercase tracking-widest font-black print:hidden">
        &copy; {new Date().getFullYear()} Instituto Educacional Canaã
      </div>

    </div>
  );
}
