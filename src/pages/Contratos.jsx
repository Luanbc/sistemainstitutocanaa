import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { logAction } from '../lib/logger';
import { FileText, Printer, Search, User, FolderKanban, Eye } from 'lucide-react';
import Swal from 'sweetalert2';

const MESES_EXT = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

function getProjectType(name = '') {
  const l = name.toLowerCase();
  if (l.includes('música') || l.includes('musica')) return 'musica';
  if (l.includes('taekwondo')) return 'taekwondo';
  if (l.includes('ballet') || l.includes('balé')) return 'ballet';
  return 'generic';
}

function Field({ val, minW = 150, grow = false }) {
  return (
    <span style={{
      borderBottom: '1px solid #000', display: 'inline-block',
      minWidth: minW, flex: grow ? 1 : 'none',
      paddingBottom: 1, fontSize: 11, fontFamily: 'Arial, sans-serif',
      marginLeft: 3, marginRight: 6,
    }}>{val || '\u00a0'}</span>
  );
}

function Row({ children }) {
  return <div style={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>{children}</div>;
}

function Lbl({ children }) {
  return <span style={{ fontWeight: 'bold', fontSize: 11, fontFamily: 'Arial, sans-serif', whiteSpace: 'nowrap' }}>{children}</span>;
}

function SecTitle({ children }) {
  return <div style={{ fontWeight: 'bold', fontSize: 11, fontFamily: 'Arial, sans-serif', textDecoration: 'underline', marginTop: 10, marginBottom: 4 }}>{children}</div>;
}

function CTitle({ children }) {
  return <div style={{ fontWeight: 'bold', fontSize: 11, fontFamily: 'Arial, sans-serif', marginTop: 8, marginBottom: 2 }}>{children}</div>;
}

function CTxt({ children }) {
  return <div style={{ fontSize: 10.5, fontFamily: 'Arial, sans-serif', textAlign: 'justify', marginBottom: 3 }}>{children}</div>;
}

function ContratoDoc({ student, project }) {
  const tipo = getProjectType(project?.nome);
  const projNome = (project?.nome || '').toUpperCase();
  const now = new Date();
  const ano = now.getFullYear();

  // Format data nascimento
  let dataNasc = '';
  if (student?.data_nascimento) {
    const [y, m, d] = student.data_nascimento.split('-');
    dataNasc = `${d}/${m}/${y}`;
  }

  // Calculate age
  let idade = '';
  if (student?.data_nascimento) {
    const birth = new Date(student.data_nascimento);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    idade = String(age);
  }

  const paiVal = student?.pai || (student?.parentesco === 'Pai' ? student?.resp : '');
  const maeVal = student?.mae || (student?.parentesco === 'Mãe' ? student?.resp : '');

  const pgStyle = {
    fontFamily: 'Arial, sans-serif', fontSize: 11,
    maxWidth: 760, margin: '0 auto', padding: '24px 40px',
    color: '#000', backgroundColor: '#fff', lineHeight: 1.4,
  };

  return (
    <div style={pgStyle} id="contrato-doc">
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'2px solid #000', paddingBottom:8, marginBottom:12 }}>
        <img src="https://i.ibb.co/hJZBJKHb/azul.png" alt="" style={{ width:50, height:50, objectFit:'contain' }} />
        <div style={{ textAlign:'center', flex:1 }}>
          <div style={{ fontWeight:'bold', fontSize:13 }}>CONTRATO DO PROJETO DE {projNome}</div>
          <div style={{ fontSize:11, marginTop:2 }}>INSTITUTO SOCIAL E EDUCACIONAL CANAÃ</div>
        </div>
        <div style={{ width:50 }} />
      </div>

      <SecTitle>DADOS DO ALUNO:</SecTitle>
      <Row><Lbl>NOME:</Lbl><Field val={student?.nome} minW={500} grow /></Row>
      <Row>
        <Lbl>DATA DE NASCIMENTO:</Lbl><Field val={dataNasc} minW={90} />
        <Lbl>IDADE:</Lbl><Field val={idade} minW={50} />
        <Lbl>SEXO:</Lbl><Field val={student?.sexo} minW={80} />
      </Row>
      <Row><Lbl>ENDEREÇO:</Lbl><Field val={student?.endereco} minW={350} grow /><Lbl>Nº:</Lbl><Field val={student?.numero} minW={60} /></Row>
      <Row>
        <Lbl>BAIRRO:</Lbl><Field val={student?.bairro} minW={150} />
        <Lbl>CIDADE:</Lbl><Field val={student?.cidade || 'São Luís'} minW={100} />
        <Lbl>UF:</Lbl><Field val={student?.uf || 'MA'} minW={30} />
        <Lbl>CEP:</Lbl><Field val={student?.cep} minW={80} />
      </Row>
      <Row><Lbl>PAI:</Lbl><Field val={paiVal} minW={480} grow /></Row>
      <Row><Lbl>MÃE:</Lbl><Field val={maeVal} minW={480} grow /></Row>

      <SecTitle>ESCOLARIDADE:</SecTitle>
      <Row><Lbl>ESCOLA:</Lbl><Field val={student?.matricula_escola} grow minW={400} /></Row>
      <Row>
        <Lbl>SÉRIE:</Lbl><Field val="" minW={80} />
        <Lbl>TURMA:</Lbl><Field val={student?.turma} minW={80} />
        <Lbl>TURNO:</Lbl><Field val={student?.turno} minW={100} />
      </Row>
      <Row><Lbl>ALUNO(A) DA CASA:</Lbl><span style={{ fontSize:11 }}>SIM (  )&nbsp;&nbsp;NÃO (  )</span></Row>

      <SecTitle>HORÁRIO DE AULA DO PROJETO:</SecTitle>
      <Row>
        <span style={{ fontSize:11 }}>MANHÃ (  )&nbsp;&nbsp;&nbsp;TARDE (  )&nbsp;&nbsp;&nbsp;</span>
        <Lbl>HORÁRIO:</Lbl><Field val="" minW={160} />
      </Row>

      {tipo === 'musica' && (
        <Row><Lbl>INSTRUMENTO:</Lbl><Field val="" minW={140} /><Lbl>TROCA DE INSTRUMENTO:</Lbl><Field val="" minW={140} /></Row>
      )}

      <Row><Lbl>FAZ PARTE DE OUTRO PROJETO?</Lbl><span style={{ fontSize:11 }}>SIM (  )  NÃO (  )</span><Lbl>QUAL?</Lbl><Field val="" minW={150} /></Row>
      <Row><Lbl>IRMÃOS EM PROJETOS?</Lbl><span style={{ fontSize:11 }}>SIM (  )  NÃO (  )</span><Lbl>QUAL?</Lbl><Field val="" minW={150} /></Row>
      <Row><Lbl>NOME DO(A) IRMÃO(A):</Lbl><Field val="" grow minW={300} /></Row>
      <Row><Lbl>OBSERVAÇÕES:</Lbl><Field val="" grow minW={400} /></Row>

      <div style={{ borderTop:'1px dashed #aaa', margin:'10px 0' }} />

      <Row><Lbl>RESPONSÁVEL LEGAL:</Lbl><Field val={student?.resp} grow minW={300} /></Row>
      <Row>
        <Lbl>CPF:</Lbl><Field val={student?.cpf} minW={150} />
        <Lbl>GRAU DE PARENTESCO:</Lbl><Field val={student?.parentesco} minW={150} />
      </Row>
      <Row><Lbl>CONTATOS:</Lbl><Field val={student?.tel} minW={180} /><span style={{ fontSize:11 }}>/</span><Field val="" minW={150} /></Row>
      <Row><Lbl>PIX TERCEIROS:</Lbl><Field val="" grow minW={300} /></Row>

      <div style={{ borderTop:'1px solid #000', margin:'10px 0' }} />

      <div style={{ fontSize:11, marginBottom:3 }}><strong>CONTRATADO:</strong> Instituto Social e Educacional Canaã, CNPJ: 16.789.671/0001-13, em Rua 50, Quadra 167, Nº 21. Conjunto São Raimundo.</div>
      <div style={{ fontSize:11, marginBottom:3 }}><strong>CONTRATANTE:</strong> Responsável pelo aluno.</div>
      <div style={{ fontSize:11, marginBottom:10, textAlign:'justify' }}>As partes acima qualificadas têm, entre si, justo e acertado, o presente contrato de prestação de serviços, referente ao PROJETO DE {projNome}, as seguintes cláusulas:</div>

      <div className="print-no-break">
        <CTitle>CLÁUSULA 1- OBJETIVO</CTitle>
        <CTxt>O OBJETIVO desse contrato é a prestação dos serviços voltados a ministrar aulas de {projNome} ao aluno no estabelecimento do INSTITUTO SOCIAL E EDUCACIONAL CANAÃ.</CTxt>
      </div>

      <div className="print-no-break">
        <CTitle>CLÁUSULA 2- DA TAXA DE MATRÍCULA</CTitle>
        <CTxt>2.1- No ato da inscrição, o RESPONSÁVEL PELO ALUNO, deverá pagar o valor da taxa da matrícula/rematrícula na secretaria do Instituto Social e Educacional Canaã.<br/>
        2.2- Em caso de DESISTÊNCIA, a secretaria do INSTITUTO, deverá ser informada. Caso contrário, O VALOR DA TAXA SERÁ COBRADO NORMALMENTE.<br/>
        2.3- Caso o aluno desista das aulas, e já tenha feito pelo menos uma aula, o CONTRATANTE, perde o direito de ter esse valor ressarcido. Se não tiver participado de nenhuma aula, terá o valor total da taxa devolvido.<br/>
        2.4- Tanto o PROFESSOR quanto o ALUNO menor de idade não têm autonomia para solicitar o cancelamento desse contrato.</CTxt>
      </div>

      <div className="print-no-break">
        <CTitle>CLÁUSULA 3- DA DURAÇÃO, FREQUÊNCIA E FALTA DAS AULAS</CTitle>
        <CTxt>3.1- As aulas ministradas terão duração de 50 minutos, duas vezes por semana, em horário pré-fixado.<br/>
        3.2- As faltas do aluno às aulas ministradas não serão repostas. Somente haverá reposição de aula para o aluno que apresentar atestado médico. Nesse caso, a reposição dar-se-á em outra turma, em horário diferente.<br/>
        3.3- Havendo falta do professor, este disponibilizará um horário para a reposição da aula perdida. Caso o aluno não compareça, o mesmo perde o direito de repor esta aula.</CTxt>
      </div>

      <div className="print-no-break">
        <CTitle>CLÁUSULA 4- DOS EVENTOS E APRESENTAÇÕES</CTitle>
        <CTxt>4.1- No decorrer do ano o INSTITUTO SOCIAL E EDUCACIONAL CANAÃ promoverá eventos ou apresentações, sendo facultativa a participação do aluno, dependendo da avaliação do professor ou interesse do aluno. O aluno deve manter o compromisso de frequentar os ensaios para obter um melhor aproveitamento.</CTxt>
      </div>

      <div className="print-no-break">
        <CTitle>CLÁUSULA 5- DOS DIREITOS DE IMAGENS</CTitle>
        <CTxt>5.1- ASSINANDO ESSE CONTRATO, o responsável pelo aluno estará AUTORIZANDO a divulgação de IMAGENS, fotos e vídeos, matérias publicitários e entrevistas em veículos de comunicação tais como rádios, televisão e demais mídias para fins informativos, promocionais ou qualquer outro tipo de divulgação relevante ao INSTITUTO, isentando-nos de quaisquer responsabilidades.</CTxt>
      </div>

      {/* Para preenchimento */}
      <div style={{ marginTop:20, borderTop:'1px solid #000', paddingTop:10 }}>
        <div style={{ fontWeight:'bold', fontSize:12, textAlign:'center', marginBottom:8, textDecoration:'underline' }}>PARA PREENCHIMENTO DA ESCOLA</div>
        <div style={{ fontWeight:'bold', fontSize:11 }}>TROCA DE PROJETO:</div>
        <Row><Lbl>PROJETO ATUAL:</Lbl><Field val="" minW={150} /><Lbl>MUDOU PARA:</Lbl><Field val="" minW={150} /></Row>
        <Row>
          <Lbl>DATA DA TRANSIÇÃO:</Lbl><Field val="" minW={90} />
          {tipo !== 'ballet' && <><Lbl>ATENDENTE:</Lbl><Field val="" minW={150} /></>}
        </Row>
        <div style={{ fontWeight:'bold', fontSize:11, marginTop:6 }}>CANCELAMENTO DO PROJETO:</div>
        <Row><Lbl>MOTIVO:</Lbl><Field val="" grow minW={350} /></Row>
        <Row>
          <Lbl>DATA DO CANCELAMENTO:</Lbl><Field val="" minW={90} />
          {tipo !== 'ballet'
            ? <><Lbl>ATENDENTE:</Lbl><Field val="" minW={150} /></>
            : <><Lbl>ASSINATURA:</Lbl><Field val="" minW={150} /></>
          }
        </Row>
      </div>

      {/* Observações Finais + Assinatura */}
      <div className="print-no-break print-signatures" style={{ marginTop:24, borderTop:'2px solid #000', paddingTop:10 }}>
        <div style={{ fontWeight:'bold', fontSize:11, textDecoration:'underline', marginBottom:4 }}>OBSERVAÇÕES FINAIS</div>
        <div style={{ fontSize:10.5, textAlign:'justify', marginBottom:20 }}>
          Os casos omissos serão analisados e resolvidos pela coordenação do Instituto Social e Educacional Canaã. Para resolver quaisquer controvérsias decorrentes do presente contrato, as partes elegem o foro judiciário da Comarca de São Luís-Maranhão.
          <br/><br/>
          E por estarem assim justos e contratados, firmam o presente instrumento, em duas vias de igual teor.
        </div>

        <div style={{ textAlign:'center', fontSize:11, marginBottom:32 }}>
          São Luís-MA _______ de _____________________ de {ano}
        </div>

        <div style={{ display:'flex', justifyContent:'space-between' }}>
          <div style={{ textAlign:'center', width:'44%' }}>
            <div style={{ borderTop:'1px solid #000', paddingTop:4, fontSize:10 }}>CONTRATANTE-Responsável pelo aluno</div>
            {student?.resp && <div style={{ fontSize:10, fontWeight:'bold' }}>{student.resp}</div>}
            {student?.cpf && <div style={{ fontSize:9 }}>CPF: {student.cpf}</div>}
          </div>
          <div style={{ textAlign:'center', width:'44%' }}>
            <div style={{ borderTop:'1px solid #000', paddingTop:4, fontSize:10 }}>CONTRATADO-Instituto Canaã</div>
          </div>
        </div>

        <div style={{ marginTop:24, fontSize:11 }}>
          <div style={{ fontWeight:'bold', marginBottom:8 }}>TESTEMUNHAS:</div>
          <div style={{ marginBottom:8 }}>NOME I:&nbsp;<span style={{ borderBottom:'1px solid #000', display:'inline-block', minWidth:380 }}>&nbsp;</span></div>
          <div>NOME II:&nbsp;<span style={{ borderBottom:'1px solid #000', display:'inline-block', minWidth:375 }}>&nbsp;</span></div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Contratos() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: st }, { data: pr }] = await Promise.all([
        supabase.from('alunos').select('*').order('nome'),
        supabase.from('projetos').select('*').order('nome'),
      ]);
      setStudents(st || []);
      setProjects(pr || []);
      setLoading(false);
    })();
  }, []);

  const filtered = students.filter(s =>
    s.nome.toLowerCase().includes(search.toLowerCase()) ||
    (s.resp || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleGenerate = () => {
    if (!selectedStudent || !selectedProject) {
      return Swal.fire('Atenção', 'Selecione um aluno e um projeto.', 'warning');
    }
    setShowPreview(true);
    logAction(supabase, user, 'contrato_gerado',
      `Contrato de ${selectedProject.nome} gerado para ${selectedStudent.nome}.`,
      'contratos');
  };

  const handlePrint = () => {
    const doc = document.getElementById('contrato-doc');
    if (!doc) return;

    const pw = window.open('', '_blank');
    pw.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Contrato ${selectedProject?.nome} - ${selectedStudent?.nome}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * { box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: #000;
      margin: 0;
      padding: 12mm 15mm;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    #contrato-doc {
      width: 100%;
      max-width: 100%;
      padding: 0;
      margin: 0;
    }
    .print-no-break { page-break-inside: avoid; break-inside: avoid; }
    .print-signatures { page-break-inside: avoid; break-inside: avoid; }
    img { max-width: 100%; display: inline-block; }
    span { display: inline; }
    div { display: block; }
  </style>
</head>
<body>${doc.outerHTML}</body>
</html>`);
    pw.document.close();
    pw.focus();
    setTimeout(() => { pw.print(); pw.close(); }, 700);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 px-2 lg:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-azul-escuro tracking-tighter flex items-center gap-3">
            <FileText className="text-azul-claro" size={32} /> Contratos
          </h2>
          <p className="text-cinza-texto font-medium text-sm mt-1">Gere contratos preenchidos automaticamente para impressão.</p>
        </div>
        {showPreview && (
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3 bg-azul-escuro text-white font-black text-[11px] uppercase tracking-widest rounded-xl hover:bg-azul-claro transition-all shadow-lg"
          >
            <Printer size={16} /> Imprimir Contrato
          </button>
        )}
      </div>

      {/* Selection Panel */}
      {!showPreview && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
          {/* Student picker */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50 flex items-center gap-3">
              <User size={18} className="text-azul-claro" />
              <span className="font-black text-azul-escuro text-sm uppercase tracking-tight">1. Selecione o Aluno</span>
            </div>
            <div className="p-4">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-3 text-gray-400" size={15} />
                <input
                  type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por nome ou responsável..."
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm outline-none border border-transparent focus:border-azul-claro/30 transition-all"
                />
              </div>
              <div className="max-h-72 overflow-y-auto space-y-1">
                {loading ? (
                  <p className="text-center py-6 text-gray-300 text-xs font-black uppercase animate-pulse">Carregando...</p>
                ) : filtered.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedStudent(s); setShowPreview(false); }}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${selectedStudent?.id === s.id ? 'bg-azul-escuro text-white' : 'hover:bg-gray-50 text-azul-escuro'}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${selectedStudent?.id === s.id ? 'bg-white/20 text-white' : 'bg-azul-claro/10 text-azul-claro'}`}>
                      {s.nome.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-sm leading-tight">{s.nome}</p>
                      <p className={`text-[10px] ${selectedStudent?.id === s.id ? 'text-white/70' : 'text-gray-400'}`}>{s.resp} · {s.turma}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Project picker + generate */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-50 flex items-center gap-3">
                <FolderKanban size={18} className="text-azul-claro" />
                <span className="font-black text-azul-escuro text-sm uppercase tracking-tight">2. Selecione o Projeto</span>
              </div>
              <div className="p-4 grid grid-cols-1 gap-2">
                {projects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProject(p)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${selectedProject?.id === p.id ? 'border-azul-claro bg-azul-claro/5 text-azul-escuro' : 'border-gray-100 hover:border-gray-200 text-gray-600'}`}
                  >
                    <p className="font-black text-sm uppercase">{p.nome}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected summary */}
            {selectedStudent && selectedProject && (
              <div className="bg-azul-escuro text-white p-4 rounded-xl space-y-1">
                <p className="text-[10px] font-black uppercase text-white/50 tracking-widest">Resumo do Contrato</p>
                <p className="font-black">{selectedStudent.nome}</p>
                <p className="text-sm text-white/70">Projeto: {selectedProject.nome}</p>
                <p className="text-sm text-white/70">Responsável: {selectedStudent.resp}</p>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!selectedStudent || !selectedProject}
              className="w-full py-4 bg-azul-claro text-white font-black text-sm uppercase tracking-widest rounded-xl hover:bg-azul-escuro transition-all shadow-lg disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Eye size={18} /> Gerar Prévia do Contrato
            </button>
          </div>
        </div>
      )}

      {/* Back button when previewing */}
      {showPreview && (
        <div className="no-print">
          <button
            onClick={() => setShowPreview(false)}
            className="text-[10px] font-black uppercase text-gray-400 hover:text-azul-escuro tracking-widest flex items-center gap-2 transition-all"
          >
            ← Voltar e alterar seleção
          </button>
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 font-medium">
            📋 Confira os dados preenchidos, imprima em duas vias e colete a assinatura presencial.
          </div>
        </div>
      )}

      {/* Contract Preview */}
      {showPreview && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-auto">
          <ContratoDoc student={selectedStudent} project={selectedProject} />
        </div>
      )}

    </div>
  );
}
