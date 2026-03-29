import React, { useEffect, useState } from 'react';
import { generatePixPayload } from '../../utils/pix';

export default function CarneItem({ item }) {
  const [qrCodeHtml, setQrCodeHtml] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Se já tivermos o QR Code do Mercado Pago (Base64), usamos ele direto
    if (item.mp_qr_code_64) {
      setQrCodeHtml(`<img src="data:image/png;base64,${item.mp_qr_code_64}" />`);
      setError('');
      return;
    }

    const generateQR = () => {
      try {
        const qrGen = window.qrcode;
        
        if (!qrGen) {
          setError('Lib não carregada');
          return;
        }

        if (!item.pix) {
          setError('Sem Chave PIX');
          return;
        }

        const payload = generatePixPayload(item.pix, item.valor, item.dna);
        const qr = qrGen(0, 'M');
        qr.addData(payload);
        qr.make();
        
        // Vamos usar ImgTag (Base64) que é mais compatível que SVG em alguns navegadores/instâncias
        const imgTag = qr.createImgTag(4, 8); // 4px por célula, 8px de margem
        setQrCodeHtml(imgTag);
        setError('');
      } catch (err) {
        console.error('Erro ao gerar QR Code:', err);
        setError('Erro na geração');
      }
    };

    if (window.qrcode) {
      generateQR();
    } else {
      const timer = setInterval(() => {
        if (window.qrcode) {
          generateQR();
          clearInterval(timer);
        }
      }, 500);
      return () => clearInterval(timer);
    }
  }, [item]);

  return (
    <div className="carne-item mx-auto flex w-full max-w-[720px] border-[1.5px] border-black bg-white min-h-[220px] text-black overflow-hidden print:break-inside-avoid print:mb-10 font-sans shadow-sm">
      {/* Canhoto (Stub) */}
      <div className="canhoto w-[15%] p-3 border-r-[1.5px] border-black flex items-center justify-center box-border bg-gray-50/20">
        <img 
          src="https://i.ibb.co/hJZBJKHb/azul.png" 
          alt="Logo" 
          className="w-full object-contain grayscale opacity-60" 
        />
      </div>

      {/* Corpo (Main Body) */}
      <div className="corpo w-[85%] p-5 flex flex-col justify-between relative box-border">
        <div className="header-carne flex items-center border-b-[1.5px] border-black pb-2 mb-3">
          <div className="text-xl font-black uppercase tracking-tighter">{item.projeto}</div>
          <div className="ml-auto text-[10px] font-black bg-black text-white px-2 py-0.5 rounded uppercase">
            PARCELA {item.parc}
          </div>
        </div>

        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 space-y-2 text-sm">
            <div className="leading-tight">
              <span className="text-[9px] font-black text-gray-400 uppercase block leading-none mb-1">Cód: {item.id}</span>
              <span className="font-black text-lg uppercase leading-none">{item.aluno}</span>
            </div>
            
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] uppercase font-bold text-azul-escuro">Responsável: <span className="text-black font-black">{item.resp || '---'}</span></p>
              <p className="text-[9px] uppercase font-bold text-gray-400">CPF do Responsável: <span className="text-gray-900 font-mono font-black">{item.cpf_resp || '---'}</span></p>
            </div>
            
            <div className="grid grid-cols-3 gap-3 py-2 border-y border-black/5 my-1">
              <div className="group-info">
                <span className="text-[8px] font-black uppercase text-gray-400 block leading-none mb-1">📅 Vencimento</span>
                <span className="text-xs font-black text-azul-escuro">{item.vencimento}</span>
              </div>
              <div className="group-info border-x border-black/5 px-3">
                <span className="text-[8px] font-black uppercase text-gray-400 block leading-none mb-1">🏫 Turma / Turno</span>
                <span className="text-[9px] font-black block uppercase text-azul-escuro">{item.turma || '---'} — {item.turno || '---'}</span>
              </div>
              <div className="group-info text-right">
                <span className="text-[8px] font-black uppercase text-gray-400 block leading-none mb-1">💰 Valor Parcela</span>
                <span className="text-xs font-black text-azul-escuro">R$ {item.valor}</span>
              </div>
            </div>
            
            <div className="bg-azul-claro/5 border-l-4 border-azul-claro p-2 rounded-r-lg text-[8px] leading-tight mb-2">
              <p className="font-black text-azul-escuro uppercase mb-0.5 flex items-center gap-1">
                ⚡ PAGAMENTO VIA PIX AUTOMÁTICO
              </p>
              <p className="text-gray-500 font-medium italic">Confirmação automática no sistema. Comprovante: <b>(98) 3261-1100</b></p>
            </div>
          </div>

          <div className="area-pix w-[130px] pt-1 flex flex-col items-center shrink-0">
            {item.valor === '0,00' || item.is_bolsista ? (
              <div className="bg-emerald-50 w-full rounded-2xl border-2 border-emerald-100 p-3 flex flex-col items-center justify-center gap-2 min-h-[110px] shadow-sm animate-in zoom-in duration-300">
                <div className="bg-white p-2 rounded-full shadow-sm">
                  <span className="text-xl">✨</span>
                </div>
                <div className="text-center">
                  <span className="block text-[10px] font-black text-emerald-600 uppercase tracking-tighter">Bolsista</span>
                  <span className="block text-[12px] font-black text-emerald-700 uppercase leading-none">Isento</span>
                </div>
              </div>
            ) : (
              <div className="bg-white p-1 rounded-lg border border-gray-100 shadow-sm flex items-center justify-center min-h-[110px] min-w-[110px]">
                {qrCodeHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: qrCodeHtml }} className="[&>img]:max-w-full [&>img]:h-auto" />
                ) : (
                  <div className="text-[8px] text-red-500 font-bold uppercase text-center">{error || 'Carregando...'}</div>
                )}
              </div>
            )}
            <div className="mt-2 text-center">
              <span className="text-[8px] font-black text-gray-400 uppercase block mb-0.5">DNA</span>
              <span className="dna-text text-[9px] font-mono font-black text-azul-escuro bg-gray-100 px-1.5 py-0.5 rounded break-all tracking-tighter">
                {item.dna}
              </span>
            </div>
          </div>
        </div>

        <div className="footer-carne text-center text-[7px] text-gray-300 font-bold mt-4 pt-1 border-t border-gray-50 uppercase tracking-[0.3em] leading-none">
          Canaã Gestão Social
        </div>
      </div>
    </div>
  );
}
