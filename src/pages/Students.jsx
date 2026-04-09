import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Pencil, Trash2, Search, Users, User, Phone, CreditCard, Hash, ChevronUp, ChevronDown, ChevronsUpDown, FolderKanban, AlertCircle, FileText, Eye, Printer, X, CheckCircle } from 'lucide-react';

import Swal from 'sweetalert2';
import { useAuth } from '../contexts/AuthContext';
import { logAction } from '../lib/logger';

const MESES_EXT = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

function getProjectType(name = '') {
  const l = name.toLowerCase();
  if (l.includes('música') || l.includes('musica')) return 'musica';
  if (l.includes('taekwondo')) return 'taekwondo';
  if (l.includes('ballet') || l.includes('balé')) return 'ballet';
  return 'generic';
}

function calculateAge(birthDate) {
  if (!birthDate) return '';
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : '';
}

function Field({ val, minW = 150, grow = false }) {
  const hasValue = !!val && val !== '' && val !== ' ';
  return (
    <span style={{
      borderBottom: hasValue ? 'none' : '1px solid #000', 
      display: 'inline-block',
      minWidth: minW, 
      flex: grow ? 1 : 'none',
      paddingBottom: hasValue ? 0 : 1, 
      fontSize: hasValue ? 13.5 : 11, 
      fontFamily: 'Arial, sans-serif',
      marginLeft: 3, 
      marginRight: 6,
      fontWeight: hasValue ? 'bold' : 'normal',
      color: '#000',
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

function ContratoDoc({ student, project, allStudents = [], allProjects = [], projectMap = {} }) {
  const tipo = getProjectType(project?.nome);
  const projNome = (project?.nome || '').toUpperCase();
  const now = new Date();
  const ano = now.getFullYear();

  // Encontrar nome do irmão e seus projetos
  const irmao = allStudents.find(s => s.id === student?.irmao_id);
  const temIrmao = !!irmao;
  const irmaoProjetosNomes = temIrmao 
    ? Array.from(projectMap[irmao.id] || [])
        .map(id => allProjects.find(p => p.id === id)?.nome)
        .filter(Boolean)
        .join(', ')
    : '';

  // Listar outros projetos do aluno (exceto o atual do contrato)

  const outrosProjetosIds = Array.from(projectMap[student?.id] || []).filter(id => id !== project?.id);
  const outrosProjetosNomes = outrosProjetosIds
    .map(id => allProjects.find(p => p.id === id)?.nome)
    .filter(Boolean)
    .join(', ');
  const temOutrosProjetos = outrosProjetosIds.length > 0;

  const isAlunoDaCasa = student?.aluno_de_fora === 'Não';

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
      <Row>
        <Lbl>PAI:</Lbl><Field val={paiVal} minW={300} grow />
      </Row>
      <Row>
        <Lbl>MÃE:</Lbl><Field val={maeVal} minW={300} grow />
      </Row>

      <SecTitle>ESCOLARIDADE:</SecTitle>
      <Row><Lbl>ESCOLA:</Lbl><Field val={student?.matricula_escola} grow minW={400} /></Row>
      <Row>
        <Lbl>SÉRIE:</Lbl><Field val={student?.serie} minW={80} />
        <Lbl>TURMA:</Lbl><Field val={student?.turma} minW={80} />
        <Lbl>TURNO:</Lbl><Field val={student?.turno} minW={100} />
      </Row>
      <Row>
        <Lbl>ALUNO(A) DA CASA:</Lbl>
        <span style={{ fontSize:11 }}>
          SIM ( {isAlunoDaCasa ? 'X' : '  '} )&nbsp;&nbsp;
          NÃO ( {!isAlunoDaCasa ? 'X' : '  '} )
        </span>
      </Row>

      <SecTitle>HORÁRIO DE AULA DO PROJETO:</SecTitle>
      <Row>
        <span style={{ fontSize:11 }}>
          MANHÃ ( {(student?.projeto_turno || '').toUpperCase().includes('MANHÃ') ? 'X' : '  '} )&nbsp;&nbsp;&nbsp;
          TARDE ( {(student?.projeto_turno || '').toUpperCase().includes('TARDE') ? 'X' : '  '} )&nbsp;&nbsp;&nbsp;
        </span>
        <Lbl>HORÁRIO:</Lbl><Field val={student?.projeto_horario} minW={160} />
      </Row>

      {tipo === 'musica' && (
        <Row><Lbl>INSTRUMENTO:</Lbl><Field val={student?.instrumento} minW={140} /><Lbl>TROCA DE INSTRUMENTO:</Lbl><Field val="" minW={140} /></Row>
      )}

      <Row>
        <Lbl>FAZ PARTE DE OUTRO PROJETO?</Lbl>
        <span style={{ fontSize:11 }}>
          SIM ( {temOutrosProjetos ? 'X' : '  '} )&nbsp;&nbsp;
          NÃO ( {!temOutrosProjetos ? 'X' : '  '} )
        </span>
        <Lbl>QUAL?</Lbl><Field val={outrosProjetosNomes} minW={150} />
      </Row>
      <Row>
        <Lbl>IRMÃOS EM PROJETOS?</Lbl>
        <span style={{ fontSize:11 }}>
          SIM ( {temIrmao ? 'X' : '  '} )&nbsp;&nbsp;
          NÃO ( {!temIrmao ? 'X' : '  '} )
        </span>
        <Lbl>QUAL?</Lbl><Field val={irmaoProjetosNomes} minW={150} />
      </Row>

      <Row><Lbl>NOME DO(A) IRMÃO(A):</Lbl><Field val={irmao?.nome?.toUpperCase()} grow minW={300} /></Row>
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

      {/* Para preenchimento da escola */}
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

export default function Students() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'nome', direction: 'asc' });
  const [studentsWithCarnes, setStudentsWithCarnes] = useState(new Set());
  const [projectFilter, setProjectFilter] = useState('all');
  const [projects, setProjects] = useState([]);
  const [studentProjectMap, setStudentProjectMap] = useState({}); // mapping aluno_id -> Set of projeto_ids (financial)
  const [studentDirectProjectMap, setStudentDirectProjectMap] = useState({}); // mapping aluno_id -> Set of projeto_ids (direct links)
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'direct_links', 'contratos'
  const [selectedStudentForContract, setSelectedStudentForContract] = useState(null);
  const [selectedProjectForContract, setSelectedProjectForContract] = useState(null);
  const [showContractPreview, setShowContractPreview] = useState(false);
  const [contractHistory, setContractHistory] = useState([]);
  const [fetchingHistory, setFetchingHistory] = useState(false);

  async function fetchContractHistory() {
    setFetchingHistory(true);
    const { data, error } = await supabase
      .from('historico_contratos')
      .select('*')
      .order('criado_em', { ascending: false })
      .limit(10);
    
    if (!error) setContractHistory(data || []);
    setFetchingHistory(false);
  }

  const handlePrintContract = async () => {
    const doc = document.getElementById('contrato-doc');
    if (!doc) return;

    // Registrar no histórico antes de abrir a janela (apenas se confirmado)
    const { error: dbErr } = await supabase
      .from('historico_contratos')
      .insert([{
        aluno_id: selectedStudentForContract?.id,
        projeto_id: selectedProjectForContract?.id,
        aluno_nome: selectedStudentForContract?.nome,
        projeto_nome: selectedProjectForContract?.nome,
        usuario_email: user?.email
      }]);

    if (!dbErr) {
      fetchContractHistory();
    }

    const pw = window.open('', '_blank');
    pw.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Contrato ${selectedProjectForContract?.nome} - ${selectedStudentForContract?.nome}</title>
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

    logAction(supabase, user, 'contrato_impresso',
      `Contrato de ${selectedProjectForContract.nome} impresso para ${selectedStudentForContract.nome}.`,
      'contratos');
  };

  // Direct Link Modal States
  const [isProjectLinkModalOpen, setIsProjectLinkModalOpen] = useState(false);
  const [selectedStudentForLink, setSelectedStudentForLink] = useState(null);
  const [studentLinks, setStudentLinks] = useState([]);

  // Form states
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [data_nascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState('');
  const [endereco, setEndereco] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('São Luís');
  const [uf, setUf] = useState('MA');
  const [cep, setCep] = useState('');
  const [pai, setPai] = useState('');
  const [mae, setMae] = useState('');
  const [resp, setResp] = useState('');
  const [parentesco, setParentesco] = useState('');
  const [cpf, setCpf] = useState('');
  const [tel, setTel] = useState('');
  const [matricula_escola, setMatriculaEscola] = useState('');
  const [turma, setTurma] = useState('');
  const [turno, setTurno] = useState('');
  const [serie, setSerie] = useState('');
  const [aluno_de_fora, setAlunoDeFora] = useState('Não');
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [hasIrmao, setHasIrmao] = useState(false);
  const [irmaoId, setIrmaoId] = useState('');
  const [instrumento, setInstrumento] = useState('');
  const [projeto_turno, setProjetoTurno] = useState('');
  const [projeto_horario, setProjetoHorario] = useState('');
  const [pai_cpf, setPaiCpf] = useState('');
  const [mae_cpf, setMaeCpf] = useState('');


  useEffect(() => {
    fetchStudents();
    fetchContractHistory();
  }, []);

  async function fetchStudents() {
    setLoading(true);
    // Fetch Alunos
    const { data: stuData, error } = await supabase
      .from('alunos')
      .select('*')
      .order('nome');

    // Fetch Financeiro to map projects and carnes
    const { data: finData } = await supabase.from('financeiro').select('aluno_id, projeto_id');
    
    // Fetch Direct Links (aluno_projeto)
    const { data: directData } = await supabase.from('aluno_projeto').select('aluno_id, projeto_id');

    // Build project maps
    const finMap = {};
    const carnesSet = new Set();
    finData?.forEach(f => {
      carnesSet.add(f.aluno_id);
      if (f.projeto_id) {
        if (!finMap[f.aluno_id]) finMap[f.aluno_id] = new Set();
        finMap[f.aluno_id].add(f.projeto_id);
      }
    });

    const directMap = {};
    directData?.forEach(d => {
      if (!directMap[d.aluno_id]) directMap[d.aluno_id] = new Set();
      directMap[d.aluno_id].add(d.projeto_id);
    });

    setStudentProjectMap(finMap);
    setStudentDirectProjectMap(directMap);
    setStudentsWithCarnes(carnesSet);

    // Fetch Projetos for filter
    const { data: proData } = await supabase.from('projetos').select('*');
    setProjects(proData || []);

    if (error) {
      Swal.fire('Erro', 'Não foi possível carregar os alunos.', 'error');
    } else {
      setStudents(stuData || []);
    }
    setLoading(false);
  }

  async function fetchStudentLinks(studentId) {
    const { data, error } = await supabase
      .from('aluno_projeto')
      .select('id, projeto_id, projetos(nome)')
      .eq('aluno_id', studentId);
    
    if (!error) setStudentLinks(data || []);
  }

  const handleOpenProjectLinks = (student) => {
    setSelectedStudentForLink(student);
    setIsProjectLinkModalOpen(true);
    fetchStudentLinks(student.id);
  };

  const handleAddLink = async (projectId) => {
    if (studentLinks.some(l => l.projeto_id === projectId)) {
      Swal.fire('Aviso', 'Este aluno já está vinculado a este projeto.', 'warning');
      return;
    }

    const { error } = await supabase
      .from('aluno_projeto')
      .insert([{ aluno_id: selectedStudentForLink.id, projeto_id: projectId }]);

    if (error) {
      Swal.fire('Erro', 'Não foi possível salvar o vínculo.', 'error');
    } else {
      fetchStudentLinks(selectedStudentForLink.id);
      fetchStudents(); // Refresh maps
    }
  };

  const handleRemoveLink = async (linkId) => {
    const { error } = await supabase.from('aluno_projeto').delete().eq('id', linkId);
    if (!error) {
      fetchStudentLinks(selectedStudentForLink.id);
      fetchStudents();
    }
  };

  const handleOpenModal = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setCodigo(student.codigo || '');
      setNome(student.nome);
      setDataNascimento(student.data_nascimento || '');
      setSexo(student.sexo || '');
      setEndereco(student.endereco || '');
      setNumero(student.numero || '');
      setBairro(student.bairro || '');
      setCidade(student.cidade || 'São Luís');
      setUf(student.uf || 'MA');
      setCep(student.cep || '');
      setPai(student.pai || '');
      setMae(student.mae || '');
      setResp(student.resp || '');
      setParentesco(student.parentesco || '');
      setCpf(student.cpf || '');
      setTel(student.tel || '');
      setMatriculaEscola(student.matricula_escola || '');
      setTurma(student.turma || '');
      setTurno(student.turno || '');
      setSerie(student.serie || '');
      setAlunoDeFora(student.aluno_de_fora || 'Não');
      setIrmaoId(student.irmao_id || '');
      setHasIrmao(!!student.irmao_id);
      setInstrumento(student.instrumento || '');
      setProjetoTurno(student.projeto_turno || '');
      setProjetoHorario(student.projeto_horario || '');
      setPaiCpf(student.pai_cpf || '');
      setMaeCpf(student.mae_cpf || '');
      setSelectedProjectIds(Array.from(studentDirectProjectMap[student.id] || []));

    } else {
      setEditingStudent(null);
      const maxNum = students.reduce((acc, s) => {
        const num = parseInt(s.codigo?.replace(/\D/g, '') || '0');
        return num > acc ? num : acc;
      }, 0);
      setCodigo(`CAN-${String(maxNum + 1).padStart(2, '0')}`);
      setNome('');
      setDataNascimento('');
      setSexo('');
      setEndereco('');
      setNumero('');
      setBairro('');
      setCidade('São Luís');
      setUf('MA');
      setCep('');
      setPai('');
      setMae('');
      setResp('');
      setParentesco('');
      setCpf('');
      setTel('');
      setMatriculaEscola('');
      setTurma('');
      setTurno('');
      setSerie('');
      setAlunoDeFora('Não');
      setIrmaoId('');
      setHasIrmao(false);
      setInstrumento('');
      setProjetoTurno('');
      setProjetoHorario('');
      setPaiCpf('');
      setMaeCpf('');
      setSelectedProjectIds([]);

    }
    setIsModalOpen(true);
  };

  const maskCPF = (value) => {
    return value
      .replace(/\D/g, '') // Remove tudo que não é dígito
      .replace(/(\d{3})(\d)/, '$1.$2') // Coloca ponto após os primeiros 3 dígitos
      .replace(/(\d{3})(\d)/, '$1.$2') // Coloca ponto após os segundos 3 dígitos
      .replace(/(\d{3})(\d{1,2})/, '$1-$2') // Coloca hífen após os terceiros 3 dígitos
      .replace(/(-\d{2})\d+?$/, '$1'); // Impede digitar mais de 11 dígitos
  };

  const maskPhone = (value) => {
    return value
      .replace(/\D/g, '') // Remove tudo que não é dígito
      .replace(/(\d{2})(\d)/, '($1) $2') // Coloca parênteses em volta do DDD
      .replace(/(\d{5})(\d)/, '$1-$2') // Coloca hífen após o prefixo (9 dígitos no total)
      .replace(/(-\d{4})\d+?$/, '$1'); // Impede digitar mais de 11 dígitos
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const studentData = {
      codigo, nome, data_nascimento, sexo,
      endereco, numero, bairro, cidade, uf, cep,
      pai, mae, resp, parentesco, cpf, tel,
      matricula_escola: (aluno_de_fora === 'Não' && !matricula_escola) ? 'INSTITUTO SOCIAL E EDUCACIONAL CANAÃ' : matricula_escola,
      turma, turno, serie, aluno_de_fora,
      irmao_id: null,
      instrumento: '',
      projeto_turno: '', 
      projeto_horario: '', 
      pai_cpf: '',
      mae_cpf: ''
    };



    let error;
    if (editingStudent) {
      const res = await supabase
        .from('alunos')
        .update(studentData)
        .eq('id', editingStudent.id);
      error = res.error;
    } else {
      const res = await supabase
        .from('alunos')
        .insert([studentData]);
      error = res.error;
    }

    setLoading(false);

    if (error) {
      Swal.fire('Erro', error.message, 'error');
    } else {
      // Sync Projects
      const sid = editingStudent ? editingStudent.id : (await supabase.from('alunos').select('id').eq('codigo', codigo).single()).data.id;
      
      // Delete old links
      if (editingStudent) {
        await supabase.from('aluno_projeto').delete().eq('aluno_id', sid);
      }

      // Insert new links
      if (selectedProjectIds.length > 0) {
        const links = selectedProjectIds.map(pid => ({ aluno_id: sid, projeto_id: pid }));
        await supabase.from('aluno_projeto').insert(links);
      }

      Swal.fire({

        title: 'Sucesso!',
        text: editingStudent ? 'Aluno atualizado com sucesso.' : 'Aluno cadastrado com sucesso.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      setIsModalOpen(false);
      await fetchStudents();
    }
  };

  const handleDelete = async (id, nomeAlu) => {
    const result = await Swal.fire({
      title: 'Deseja excluir?',
      text: `Deseja realmente excluir o aluno "${nomeAlu}"? Os carnês já gerados permanecem no sistema.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#E53E3E',
      cancelButtonColor: '#132638',
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setLoading(true);
      const { error } = await supabase.from('alunos').delete().eq('id', id);
      setLoading(false);

      if (error) {
        Swal.fire('Erro', 'Não foi possível excluir o aluno.', 'error');
      } else {
        Swal.fire('Excluído!', 'O registro do aluno foi removido.', 'success');
        fetchStudents();
      }
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ChevronsUpDown size={14} className="text-gray-300" />;
    return sortConfig.direction === 'asc' ?
      <ChevronUp size={14} className="text-azul-claro" /> :
      <ChevronDown size={14} className="text-azul-claro" />;
  };

  const [onlyWithoutCarnes, setOnlyWithoutCarnes] = useState(false);

  const filteredStudents = students
    .filter(s => {
      const searchMatch = s.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.resp && s.resp.toLowerCase().includes(searchTerm.toLowerCase()));

      const carneMatch = onlyWithoutCarnes ? !studentsWithCarnes.has(s.id) : true;
      const projectMatch = projectFilter === 'all' || 
                           (studentProjectMap[s.id] && studentProjectMap[s.id].has(projectFilter)) ||
                           (studentDirectProjectMap[s.id] && studentDirectProjectMap[s.id].has(projectFilter));

      return searchMatch && carneMatch && projectMatch;
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;

      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-azul-escuro dark:text-white flex items-center gap-2">
            <Users className="text-azul-claro" size={22} />
            Gestão de Alunos
          </h2>
          <p className="text-xs text-cinza-texto dark:text-slate-400 font-medium mt-0.5">Cadastre e gerencie os alunos vinculados aos projetos.</p>
        </div>

        <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
          <button 
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'list' ? 'bg-azul-escuro dark:bg-azul-claro text-white dark:text-azul-escuro shadow-md' : 'text-gray-400 hover:text-azul-escuro dark:hover:text-white'}`}
          >
            Gestão Geral
          </button>
          <button 
            onClick={() => setActiveTab('contratos')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'contratos' ? 'bg-azul-escuro dark:bg-azul-claro text-white dark:text-azul-escuro shadow-md' : 'text-gray-400 hover:text-azul-escuro dark:hover:text-white'}`}
          >
            Contratos
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="ml-2 bg-azul-claro text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-sm"
          >
            <Plus size={14} />
            Cadastrar Aluno
          </button>
        </div>
      </div>

      {activeTab === 'contratos' && (
        <div className="flex items-center gap-4 no-print mb-4 animate-in fade-in duration-300">
           {showContractPreview && (
            <button
              onClick={() => handlePrintContract()}
              className="flex items-center gap-2 px-6 py-3 bg-azul-escuro text-white font-black text-[11px] uppercase tracking-widest rounded-xl hover:bg-azul-claro transition-all shadow-lg"
            >
              <Printer size={16} /> Imprimir Contrato
            </button>
          )}
           {showContractPreview && (
            <button
              onClick={() => setShowContractPreview(false)}
              className="text-[10px] font-black uppercase text-gray-400 hover:text-azul-escuro tracking-widest flex items-center gap-2 transition-all"
            >
              ← Voltar e alterar seleção
            </button>
          )}
        </div>
      )}

      {activeTab === 'list' ? (
        <>
          {/* Stats & Quick Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-md border border-gray-100 dark:border-slate-800 flex items-center gap-2 shadow-sm flex-1 sm:flex-none justify-center sm:justify-start">
                <Hash size={12} className="text-azul-claro" />
                <span className="text-[10px] font-black text-azul-escuro dark:text-white uppercase tracking-tight">{students.length} Total</span>
              </div>
              <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-md border border-gray-100 dark:border-slate-800 flex items-center gap-2 shadow-sm flex-1 sm:flex-none justify-center sm:justify-start">
                <CreditCard size={12} className="text-emerald-500" />
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">{studentsWithCarnes.size} Com Carnê</span>
              </div>
              <div className="bg-azul-claro/10 px-3 py-1.5 rounded-md border border-azul-claro/20 flex items-center gap-2 flex-1 sm:flex-none justify-center sm:justify-start">
                <User size={12} className="text-azul-claro" />
                <span className="text-[10px] font-black text-azul-escuro dark:text-white uppercase tracking-tight">{filteredStudents.length} {projectFilter !== 'all' ? 'Filtrados' : 'Vistos'}</span>
              </div>
            </div>

            <button
              onClick={() => setOnlyWithoutCarnes(!onlyWithoutCarnes)}
              className={`w-full sm:w-auto px-3 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all border ${onlyWithoutCarnes ? 'bg-vermelho text-white border-vermelho shadow-sm shadow-red-200' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'}`}
            >
              {onlyWithoutCarnes ? '👀 Sem carnê' : 'Filtro: Sem Carnê'}
            </button>
          </div>

          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 px-3 py-2.5 rounded-lg border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-2 transition-all">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-2.5 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Buscar por nome, código ou responsável..."
                className="w-full pl-8 pr-3 py-2 bg-gray-50 dark:bg-slate-800 rounded-md outline-none text-xs font-medium border border-transparent focus:border-azul-claro/20 dark:text-white transition-all"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-1.5">
              <select 
                value={projectFilter} 
                onChange={(e) => setProjectFilter(e.target.value)}
                className="flex-1 md:flex-none px-3 py-2 bg-gray-50 dark:bg-slate-800 rounded-md outline-none text-[10px] font-black uppercase text-azul-escuro dark:text-white border-none min-w-[160px]"
              >
                <option value="all" className="dark:bg-slate-900">TODOS PROJETOS 📂</option>
                {projects.map(p => <option key={p.id} value={p.id} className="dark:bg-slate-900">{p.nome}</option>)}
              </select>
            </div>
          </div>

          {/* Table Area */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-all">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                    <th className="px-6 py-5 text-[10px] font-black text-black dark:text-white uppercase tracking-widest cursor-pointer hover:bg-gray-100/50 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleSort('nome')}>
                      <div className="flex items-center gap-2">Cód / Aluno {getSortIcon('nome')}</div>
                    </th>
                    <th className="px-6 py-5 text-[10px] font-black text-black dark:text-white uppercase tracking-widest cursor-pointer hover:bg-gray-100/50 dark:hover:bg-slate-700/50 transition-colors" onClick={() => handleSort('resp')}>
                      <div className="flex items-center gap-2">Responsável {getSortIcon('resp')}</div>
                    </th>
                    <th className="px-6 py-5 text-[10px] font-black text-black dark:text-white uppercase tracking-widest hidden lg:table-cell">CPF RESPONSÁVEL</th>
                    <th className="px-6 py-5 text-[10px] font-black text-black dark:text-white uppercase tracking-widest">Contato</th>
                    <th className="px-6 py-5 text-[10px] font-black text-black dark:text-white uppercase tracking-widest text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {loading && students.length === 0 ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan="5" className="px-6 py-6 h-16 bg-gray-50/20"></td>
                      </tr>
                    ))
                  ) : filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-azul-claro/[0.02] dark:hover:bg-slate-800/30 transition-colors group text-black dark:text-white">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-0.5">
                              {(student.serie || student.turma) && (
                                <span className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-100 dark:border-amber-900/50 uppercase tracking-tighter">
                                  {student.serie || ''}{student.turma || ''} - {student.turno}
                                </span>
                              )}
                              {studentsWithCarnes.has(student.id) && (
                                <span className="bg-blue-50 dark:bg-blue-900/30 text-azul-claro dark:text-blue-400 text-[9px] font-black px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/50 uppercase tracking-tighter">Carnê Ativo</span>
                              )}
                            </div>
                            <span className="text-sm font-bold text-azul-escuro dark:text-slate-100">{student.nome}</span>
                            {student.aluno_de_fora === 'Sim' ? (
                              student.matricula_escola && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Escola: {student.matricula_escola}</span>
                            ) : (
                              student.codigo && <span className="text-[10px] text-azul-escuro dark:text-azul-claro font-bold uppercase">Mat: {student.codigo}</span>
                            )}
                          </div>

                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col text-sm text-cinza-texto dark:text-slate-400">
                            <div className="flex items-center gap-2">
                              <User size={14} className="text-gray-300 dark:text-slate-600" />
                              {student.resp || <span className="text-gray-300 dark:text-slate-600 italic">Não informado</span>}
                            </div>
                            {student.parentesco && <span className="text-[10px] text-azul-claro font-bold ml-5 uppercase tracking-wider">{student.parentesco}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <div className="flex items-center gap-2 text-xs text-cinza-texto font-mono whitespace-nowrap">
                            <CreditCard size={14} className="text-gray-300 shrink-0" />
                            {student.cpf || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-xs text-cinza-texto whitespace-nowrap">
                            <Phone size={14} className="text-gray-300 shrink-0" />
                            {student.tel || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => handleOpenProjectLinks(student)} className="p-2.5 bg-azul-claro/10 text-azul-claro rounded-xl hover:bg-azul-claro hover:text-white transition-all" title="Ver Projetos">
                              <FolderKanban size={16} />
                            </button>
                            <button onClick={() => handleOpenModal(student)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all" title="Editar">
                              <Pencil size={16} />
                            </button>
                            <button onClick={() => handleDelete(student.id, student.nome)} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all" title="Excluir">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-20 text-center text-gray-400 text-sm italic">Nenhum aluno cadastrado ou encontrado na busca.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden">
              {loading && students.length === 0 ? (
                <div className="py-12 text-center font-black text-azul-escuro/10 dark:text-white/10 uppercase tracking-widest animate-pulse">Carregando...</div>
              ) : filteredStudents.length > 0 ? (
                <div className="divide-y divide-gray-50 dark:divide-slate-800">
                  {filteredStudents.map((student) => (
                    <div key={student.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap gap-1.5 mb-1">
                            {(student.serie || student.turma) && (
                              <span className="bg-amber-50 text-amber-700 text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-100 uppercase">
                                {student.serie || ''}{student.turma || ''} · {student.turno}
                              </span>
                            )}
                            {studentsWithCarnes.has(student.id) && (
                              <span className="bg-blue-50 text-azul-claro text-[9px] font-black px-2 py-0.5 rounded-full border border-blue-100 uppercase">Carnê ✓</span>
                            )}
                          </div>
                          <p className="font-black text-azul-escuro text-sm uppercase leading-tight">{student.nome}</p>
                          <div className="flex flex-wrap gap-x-2 mt-0.5">
                            {student.aluno_de_fora === 'Sim' ? (
                              student.matricula_escola && <span className="text-[10px] text-emerald-600 font-bold uppercase whitespace-nowrap">Escola: {student.matricula_escola}</span>
                            ) : (
                              student.codigo && <span className="text-[10px] text-azul-escuro font-bold uppercase whitespace-nowrap">Mat: {student.codigo}</span>
                            )}
                            <p className="text-[10px] text-gray-400 font-bold">
                              {student.resp ? `· ${student.resp}${student.parentesco ? ` (${student.parentesco})` : ''}` : '· Sem responsável'}
                            </p>
                          </div>
                          {student.tel && (
                            <p className="text-[10px] text-azul-claro font-bold flex items-center gap-1 mt-0.5">
                              <Phone size={10} /> {student.tel}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button onClick={() => handleOpenProjectLinks(student)} className="p-2.5 bg-azul-claro/10 text-azul-claro rounded-xl hover:bg-azul-claro hover:text-white transition-all">
                            <FolderKanban size={16} />
                          </button>
                          <button onClick={() => handleOpenModal(student)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => handleDelete(student.id, student.nome)} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center text-gray-400 text-sm italic">Nenhum aluno encontrado.</div>
              )}
            </div>
          </div>
        </>
      ) : activeTab === 'contratos' ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          {!showContractPreview ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
                  <div className="p-4 border-b border-gray-50 dark:border-slate-800 flex items-center gap-3">
                    <User size={18} className="text-azul-claro" />
                    <span className="font-black text-azul-escuro dark:text-white text-sm uppercase tracking-tight">1. Selecione o Aluno</span>
                  </div>
                  <div className="p-4">
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-3 text-gray-400" size={15} />
                      <input
                        type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nome ou responsável..."
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 rounded-xl text-sm outline-none border border-transparent focus:border-azul-claro/30 dark:text-white transition-all"
                      />
                    </div>
                    <div className="max-h-72 overflow-y-auto space-y-1 custom-scrollbar">
                      {filteredStudents.slice(0, 50).map(s => (
                        <button
                          key={s.id}
                          onClick={() => { setSelectedStudentForContract(s); setShowContractPreview(false); }}
                          className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${selectedStudentForContract?.id === s.id ? 'bg-azul-escuro dark:bg-azul-claro text-white dark:text-azul-escuro' : 'hover:bg-gray-50 dark:hover:bg-slate-800 text-azul-escuro dark:text-slate-300'}`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${selectedStudentForContract?.id === s.id ? 'bg-white/20 text-white' : 'bg-azul-claro/10 text-azul-claro'}`}>
                            {s.nome.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-sm leading-tight">{s.nome}</p>
                            <p className={`text-[10px] uppercase font-bold ${selectedStudentForContract?.id === s.id ? 'text-white/70' : 'text-gray-400 dark:text-slate-500'}`}>
                              {s.aluno_de_fora === 'Sim' ? `Escola: ${s.matricula_escola || 'Não informada'}` : `Mat: ${s.codigo || 'S/ Mat'}`}
                              {(s.serie || s.turma) && ` · ${s.serie || ''}${s.turma || ''}`}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
                    <div className="p-4 border-b border-gray-50 dark:border-slate-800 flex items-center gap-3">
                      <FolderKanban size={18} className="text-azul-claro" />
                      <span className="font-black text-azul-escuro dark:text-white text-sm uppercase tracking-tight">2. Selecione o Projeto</span>
                    </div>
                    <div className="p-4 grid grid-cols-1 gap-2">
                      {projects.map(p => (
                        <button
                          key={p.id}
                          onClick={() => setSelectedProjectForContract(p)}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${selectedProjectForContract?.id === p.id ? 'border-azul-claro bg-azul-claro/5 text-azul-escuro dark:text-white dark:bg-azul-claro/10' : 'border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 text-gray-600 dark:text-slate-400'}`}
                        >
                          <p className="font-black text-sm uppercase">{p.nome}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedStudentForContract && selectedProjectForContract && (
                    <div className="bg-azul-escuro text-white p-4 rounded-xl space-y-1">
                      <p className="text-[10px] font-black uppercase text-white/50 tracking-widest">Resumo do Contrato</p>
                      <p className="font-black">{selectedStudentForContract.nome}</p>
                      <p className="text-sm text-white/70">Projeto: {selectedProjectForContract.nome}</p>
                    </div>
                  )}

                  <button
                    onClick={() => setShowContractPreview(true)}
                    disabled={!selectedStudentForContract || !selectedProjectForContract}
                    className="w-full py-4 bg-azul-claro text-white font-black text-sm uppercase tracking-widest rounded-xl hover:bg-azul-escuro transition-all shadow-lg disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Eye size={18} /> Gerar Prévia do Contrato
                  </button>
                </div>
              </div>

              {/* History Section */}
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-azul-claro/10 text-azul-claro rounded-lg">
                    <FileText size={18} />
                  </div>
                  <h3 className="font-black text-azul-escuro uppercase tracking-widest text-sm">Contratos Impressos Recentemente</h3>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                        <th className="px-6 py-4 text-[10px] font-black text-black dark:text-white uppercase tracking-widest">Aluno</th>
                        <th className="px-6 py-4 text-[10px] font-black text-black dark:text-white uppercase tracking-widest">Projeto</th>
                        <th className="px-6 py-4 text-[10px] font-black text-black dark:text-white uppercase tracking-widest">Data / Usuário</th>
                        <th className="px-6 py-4 text-[10px] font-black text-black dark:text-white uppercase tracking-widest text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                      {fetchingHistory ? (
                        Array(3).fill(0).map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            <td colSpan="4" className="px-6 py-6 h-12 bg-gray-50/20"></td>
                          </tr>
                        ))
                      ) : contractHistory.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-12 text-center text-gray-400 text-xs italic">Nenhum histórico de impressão encontrado.</td>
                        </tr>
                      ) : (
                        contractHistory.map(item => (
                          <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                            <td className="px-6 py-4 font-bold text-azul-escuro text-sm uppercase">{item.aluno_nome}</td>
                            <td className="px-6 py-4">
                              <span className="bg-azul-claro/10 text-azul-claro text-[9px] font-black px-2 py-0.5 rounded-full border border-azul-claro/20 uppercase">{item.projeto_nome}</span>
                            </td>
                            <td className="px-6 py-4 text-[10px] text-gray-400">
                              <p className="font-black">{new Date(item.criado_em).toLocaleString('pt-BR')}</p>
                              <p>{item.usuario_email}</p>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button 
                                onClick={() => {
                                  const student = students.find(s => s.id === item.aluno_id);
                                  const project = projects.find(p => p.id === item.projeto_id);
                                  if (student && project) {
                                    setSelectedStudentForContract(student);
                                    setSelectedProjectForContract(project);
                                    setShowContractPreview(true);
                                  } else {
                                    Swal.fire('Info', 'Este aluno ou projeto não estão mais ativos no sistema.', 'info');
                                  }
                                }}
                                className="px-3 py-1.5 bg-azul-escuro text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-azul-claro transition-all"
                              >
                                Reabrir
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between no-print bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <button
                  onClick={() => setShowContractPreview(false)}
                  className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-azul-escuro tracking-widest transition-all"
                >
                  <X size={16} /> Cancelar / Voltar
                </button>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-amber-600 font-bold uppercase hidden md:block">⚠️ O registro será salvo após clicar em imprimir</p>
                  <button
                    onClick={handlePrintContract}
                    className="flex items-center gap-2 px-6 py-2.5 bg-azul-escuro text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-azul-claro transition-all shadow-lg"
                  >
                    <Printer size={16} /> Confirmar e Imprimir
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-auto">
                <ContratoDoc 
                  student={selectedStudentForContract} 
                  project={selectedProjectForContract} 
                  allStudents={students} 
                  allProjects={projects} 
                  projectMap={studentDirectProjectMap}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden animate-in fade-in duration-300">
          <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 transition-colors">
            <h3 className="font-black text-azul-escuro dark:text-white uppercase tracking-widest text-sm flex items-center gap-2">
              <FolderKanban className="text-azul-claro" size={18} />
              Vínculos Diretos (Sem Carnê)
            </h3>
            <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase mt-1">Lista de alunos vinculados a projetos sem obrigatoriedade de financeiro.</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/30 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-800">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Aluno</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Projeto</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {students.filter(s => studentDirectProjectMap[s.id]?.size > 0).length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-12 text-center text-gray-400 text-xs italic">Nenhum vínculo direto encontrado.</td>
                  </tr>
                ) : (
                  students.filter(s => studentDirectProjectMap[s.id]?.size > 0).map(student => (
                    Array.from(studentDirectProjectMap[student.id]).map(projectId => {
                      const project = projects.find(p => p.id === projectId);
                      return (
                        <tr key={`${student.id}-${projectId}`} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3">
                            <p className="text-sm font-bold text-azul-escuro">{student.nome}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{student.codigo}</p>
                          </td>
                          <td className="px-6 py-3">
                            <span className="bg-azul-claro/10 text-azul-claro text-[9px] font-black px-2 py-0.5 rounded-full border border-azul-claro/20 uppercase">
                              {project?.nome || 'Projeto não encontrado'}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-center">
                            <button 
                              onClick={() => handleOpenProjectLinks(student)}
                              className="p-2 text-azul-claro hover:bg-azul-claro/10 rounded-lg transition-all"
                              title="Gerenciar Vínculos"
                            >
                              <Pencil size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal - Student Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-azul-escuro/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-6xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300 border border-transparent dark:border-slate-800">
            <div className="bg-gradient-to-r from-azul-escuro to-[#1a2f43] dark:from-slate-900 dark:to-slate-950 p-8 text-white relative border-b dark:border-slate-800 transition-all">
              <h3 className="text-2xl font-bold">{editingStudent ? 'Editar Ficha' : 'Ficha de Matrícula'}</h3>
              <p className="text-blue-200/80 dark:text-slate-400 text-sm mt-1">Dados básicos e acadêmicos do aluno</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[75vh] custom-scrollbar">
              {/* ── DADOS DO ALUNO ── */}
              <div className="md:col-span-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-azul-claro dark:text-azul-claro/80 border-b border-azul-claro/20 pb-1 mb-3">Dados do Aluno</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:col-span-2">
                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">Matrícula</label>
                  <input type="text" value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="CAN-00"
                    className="w-full p-3 bg-gray-50 dark:bg-slate-800 border-2 border-transparent dark:border-slate-700 rounded-xl outline-none focus:border-azul-claro text-azul-escuro dark:text-white font-mono font-bold transition-all" />
                </div>

                <div className="space-y-1.5 md:col-span-3">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">Nome Completo do Aluno *</label>
                  <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: João da Silva Santos" required
                    className="w-full p-3 bg-gray-50 dark:bg-slate-800 border-2 border-transparent dark:border-slate-700 rounded-xl outline-none focus:border-azul-claro text-azul-escuro dark:text-white font-bold transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:col-span-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">Data de Nascimento</label>
                  <input type="date" value={data_nascimento} onChange={e => setDataNascimento(e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-slate-800 border-2 border-transparent dark:border-slate-700 rounded-xl outline-none focus:border-azul-claro text-azul-escuro dark:text-white font-bold transition-all" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">Idade (Visualização)</label>
                  <input type="text" value={calculateAge(data_nascimento)} readOnly
                    className="w-full p-3 bg-gray-100 dark:bg-slate-700 border-2 border-transparent dark:border-slate-600 rounded-xl text-gray-500 dark:text-gray-400 font-bold text-center cursor-not-allowed transition-all" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">Sexo</label>
                  <select value={sexo} onChange={e => setSexo(e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-slate-800 border-2 border-transparent dark:border-slate-700 rounded-xl outline-none focus:border-azul-claro text-azul-escuro dark:text-white font-bold transition-all">
                    <option value="" className="dark:bg-slate-800">Selecione...</option>
                    <option value="Masculino" className="dark:bg-slate-800">Masculino</option>
                    <option value="Feminino" className="dark:bg-slate-800">Feminino</option>
                    <option value="Outro" className="dark:bg-slate-800">Outro</option>
                  </select>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">Já é aluno da Instituição?</label>
                <div className="flex gap-6 mt-1 p-2 bg-gray-50 dark:bg-slate-800/50 border-2 border-transparent dark:border-slate-700 rounded-xl transition-all">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-azul-escuro dark:text-slate-200 text-sm hover:opacity-80 transition-opacity">
                    <input type="radio" name="aluno_de_fora" value="Não" checked={aluno_de_fora === 'Não'} onChange={(e) => setAlunoDeFora(e.target.value)} className="w-4 h-4 accent-azul-claro cursor-pointer" />
                    Sim (Canaã)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-azul-escuro dark:text-slate-200 text-sm hover:opacity-80 transition-opacity">
                    <input type="radio" name="aluno_de_fora" value="Sim" checked={aluno_de_fora === 'Sim'} onChange={(e) => setAlunoDeFora(e.target.value)} className="w-4 h-4 accent-azul-claro cursor-pointer" />
                    Não (Externo)
                  </label>
                </div>
              </div>

              {/* ── ESCOLARIDADE ── */}
              <div className="md:col-span-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-azul-claro dark:text-azul-claro/80 border-b border-azul-claro/20 pb-1 mb-3 mt-2 font-mono">Escolaridade</p>
              </div>

              <div className="md:col-span-2 space-y-1.5 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-slate-800 transition-all">
                <label className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">Nome da Escola *</label>
                <input type="text" value={matricula_escola} onChange={e => setMatriculaEscola(e.target.value)} 
                  placeholder={aluno_de_fora === 'Não' ? 'INSTITUTO SOCIAL E EDUCACIONAL CANAÃ' : 'Onde o aluno estuda?'}
                  className="w-full p-3 bg-white dark:bg-slate-800 border-2 border-transparent dark:border-slate-700 rounded-xl outline-none focus:border-azul-claro text-azul-escuro dark:text-white font-bold transition-all" required />
              </div>

              {/* ── SÉRIE / TURMA / TURNO (UNIFICADO) ── */}
              <div className="md:col-span-2 grid grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-slate-800/30 rounded-2xl border border-gray-100 dark:border-slate-800">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 text-center block">Série</label>
                  <input type="text" value={serie} onChange={e => setSerie(e.target.value)} placeholder="Ex: 5º"
                    className="w-full p-3 bg-white dark:bg-slate-800 border-2 border-transparent dark:border-slate-700 rounded-xl outline-none focus:border-azul-claro text-azul-escuro dark:text-white font-bold text-center uppercase transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 text-center block">Turma</label>
                  <input type="text" value={turma} onChange={e => setTurma(e.target.value)} placeholder="Ex: A"
                    className="w-full p-3 bg-white dark:bg-slate-800 border-2 border-transparent dark:border-slate-700 rounded-xl outline-none focus:border-azul-claro text-azul-escuro dark:text-white font-bold text-center uppercase transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 text-center block">Turno Escolar</label>
                  <select value={turno} onChange={e => setTurno(e.target.value)}
                    className="w-full p-3 bg-white dark:bg-slate-800 border-2 border-transparent dark:border-slate-700 rounded-xl outline-none focus:border-azul-claro text-azul-escuro dark:text-white font-bold text-xs transition-all">
                    <option value="" className="dark:bg-slate-800">Selecione...</option>
                    <option value="Manhã" className="dark:bg-slate-800">Manhã</option>
                    <option value="Tarde" className="dark:bg-slate-800">Tarde</option>
                  </select>
                </div>

                {/* BLOCO REMOVIDO DAQUI */}
              </div>

              {/* ── ENDEREÇO ── */}
              <div className="md:col-span-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-azul-claro dark:text-azul-claro/80 border-b border-azul-claro/20 pb-1 mb-3 mt-2 font-mono">Endereço Residencial</p>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">Logradouro / Endereço</label>
                <div className="flex gap-2">
                  <input type="text" value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Rua, Avenida..." className="flex-1 p-3 bg-gray-50 dark:bg-slate-800 border-2 border-transparent dark:border-slate-700 rounded-xl outline-none focus:border-azul-claro text-azul-escuro dark:text-white font-bold transition-all" />
                  <input type="text" value={numero} onChange={e => setNumero(e.target.value)} placeholder="Nº" className="w-20 p-3 bg-gray-50 dark:bg-slate-800 border-2 border-transparent dark:border-slate-700 rounded-xl outline-none focus:border-azul-claro text-azul-escuro dark:text-white font-bold text-center transition-all" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">Bairro</label>
                <input type="text" value={bairro} onChange={e => setBairro(e.target.value)} placeholder="Ex: Centro"
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800 border-2 border-transparent dark:border-slate-700 rounded-xl outline-none focus:border-azul-claro text-azul-escuro dark:text-white font-bold transition-all" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">CEP</label>
                <input type="text" value={cep} onChange={e => setCep(e.target.value)} placeholder="00000-000" maxLength={9}
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800 border-2 border-transparent dark:border-slate-700 rounded-xl outline-none focus:border-azul-claro text-azul-escuro dark:text-white font-mono font-bold transition-all" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">Cidade</label>
                <input type="text" value={cidade} onChange={e => setCidade(e.target.value)}
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800 border-2 border-transparent dark:border-slate-700 rounded-xl outline-none focus:border-azul-claro text-azul-escuro dark:text-white font-bold transition-all" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">UF / Estado</label>
                <input type="text" value={uf} onChange={e => setUf(e.target.value)} maxLength={2}
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800 border-2 border-transparent dark:border-slate-700 rounded-xl outline-none focus:border-azul-claro text-azul-escuro dark:text-white font-bold uppercase text-center transition-all" />
              </div>

              {/* ── FILIAÇÃO ── */}
              <div className="md:col-span-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-azul-claro dark:text-azul-claro/80 border-b border-azul-claro/20 pb-1 mb-3 mt-2 font-mono">Filiação</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">Nome do Pai</label>
                  <input type="text" value={pai} onChange={e => setPai(e.target.value)} placeholder="Nome completo"
                    className="w-full p-3 bg-white dark:bg-slate-800 border-2 border-transparent dark:border-slate-700 rounded-xl outline-none focus:border-azul-claro text-azul-escuro dark:text-white font-bold text-xs transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">Nome da Mãe</label>
                  <input type="text" value={mae} onChange={e => setMae(e.target.value)} placeholder="Nome completo"
                    className="w-full p-3 bg-white dark:bg-slate-800 border-2 border-transparent dark:border-slate-700 rounded-xl outline-none focus:border-azul-claro text-azul-escuro dark:text-white font-bold text-xs transition-all" />
                </div>
              </div>

              {/* ── SELEÇÃO DE PROJETOS ── */}
              <div className="md:col-span-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-azul-claro dark:text-azul-claro/80 border-b border-azul-claro/20 pb-1 mb-3 mt-2 font-mono">Projetos do Aluno</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {projects.map(proj => (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => {
                        setSelectedProjectIds(prev => 
                          prev.includes(proj.id) ? prev.filter(id => id !== proj.id) : [...prev, proj.id]
                        );
                      }}
                      className={`p-3 rounded-xl border-2 text-left transition-all flex items-center justify-between ${selectedProjectIds.includes(proj.id) ? 'border-azul-claro bg-azul-claro/5 dark:bg-azul-claro/10 text-azul-escuro dark:text-white shadow-sm' : 'border-gray-100 dark:border-slate-800 text-gray-400 dark:text-slate-600 hover:border-gray-200 dark:hover:border-slate-700'}`}
                    >
                      <span className="text-[10px] font-black uppercase">{proj.nome}</span>
                      {selectedProjectIds.includes(proj.id) && <CheckCircle size={14} className="text-azul-claro" />}
                    </button>
                  ))}
                </div>
              </div>


              {/* ── RESPONSÁVEL LEGAL ── */}
              <div className="md:col-span-2 space-y-4 bg-azul-claro/5 dark:bg-blue-900/10 p-5 rounded-2xl border border-azul-claro/10 dark:border-blue-900/30 mt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-azul-claro font-mono">Responsável Legal</p>
                    <p className="text-[9px] text-azul-escuro/40 dark:text-slate-400 font-bold uppercase mt-0.5">Tutor que assina o contrato e recebe o carnê</p>
                  </div>
                  <div className="flex gap-2">
                    {mae && (
                      <button type="button" onClick={() => { setResp(mae); setParentesco('Mãe'); if(mae_cpf) setCpf(mae_cpf); }}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-azul-claro/20 dark:border-azul-claro/40 rounded-lg text-[9px] font-black uppercase text-azul-claro hover:bg-azul-claro hover:text-white transition-all shadow-sm flex items-center gap-1">
                        <User size={10} /> Copiar Mãe
                      </button>
                    )}
                    {pai && (
                      <button type="button" onClick={() => { setResp(pai); setParentesco('Pai'); if(pai_cpf) setCpf(pai_cpf); }}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-azul-claro/20 dark:border-azul-claro/40 rounded-lg text-[9px] font-black uppercase text-azul-claro hover:bg-azul-claro hover:text-white transition-all shadow-sm flex items-center gap-1">
                        <User size={10} /> Copiar Pai
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-azul-escuro/60 dark:text-slate-400">Nome do Responsável *</label>
                  <input type="text" value={resp} onChange={e => setResp(e.target.value)} placeholder="Nome do tutor legal" required
                    className="w-full p-3 bg-white dark:bg-slate-800 border-2 border-transparent dark:border-slate-700 rounded-xl outline-none focus:border-azul-claro text-azul-escuro dark:text-white font-bold shadow-sm transition-all" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-azul-escuro/60 dark:text-slate-400">Grau de Parentesco *</label>
                    <select value={parentesco} onChange={e => setParentesco(e.target.value)} required
                      className="w-full p-3 bg-white dark:bg-slate-800 border-2 border-transparent dark:border-slate-700 rounded-xl outline-none focus:border-azul-claro text-azul-escuro dark:text-white font-bold shadow-sm text-sm transition-all">
                      <option value="" className="dark:bg-slate-800">Selecione...</option>
                      <option value="Pai" className="dark:bg-slate-800">Pai</option>
                      <option value="Mãe" className="dark:bg-slate-800">Mãe</option>
                      <option value="Avô / Avó" className="dark:bg-slate-800">Avô / Avó</option>
                      <option value="Tio / Tia" className="dark:bg-slate-800">Tio / Tia</option>
                      <option value="Irmão / Irmã" className="dark:bg-slate-800">Irmão / Irmã</option>
                      <option value="Outro" className="dark:bg-slate-800">Outro</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-azul-escuro/60 dark:text-slate-400">CPF do Responsável *</label>
                    <input type="text" value={cpf} onChange={e => setCpf(maskCPF(e.target.value))} placeholder="000.000.000-00" maxLength={14} required
                      className="w-full p-3 bg-white dark:bg-slate-800 border-2 border-transparent dark:border-slate-700 rounded-xl outline-none focus:border-azul-claro text-azul-escuro dark:text-white font-mono shadow-sm transition-all" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-azul-escuro/60 dark:text-slate-400">Telefone / WhatsApp *</label>
                  <input type="text" value={tel} onChange={e => setTel(maskPhone(e.target.value))} placeholder="(00) 00000-0000" maxLength={15} required
                    className="w-full p-3 bg-white dark:bg-slate-800 border-2 border-transparent dark:border-slate-700 rounded-xl outline-none focus:border-azul-claro text-azul-escuro dark:text-white font-bold shadow-sm transition-all" />
                </div>
              </div>

              <div className="flex gap-4 pt-4 md:col-span-2">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 text-azul-escuro dark:text-white font-bold hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  Fechar
                </button>
                <button type="submit" disabled={loading}
                  className="flex-[2] py-4 bg-azul-escuro dark:bg-azul-claro text-amarelo-canaa dark:text-azul-escuro font-black rounded-xl shadow-xl shadow-azul-escuro/20 dark:shadow-azul-claro/10 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
                  {loading ? 'Salvando...' : 'FINALIZAR CADASTRO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Project Links */}
      {isProjectLinkModalOpen && selectedStudentForLink && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-azul-escuro/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-white/5">
            <div className="bg-azul-escuro dark:bg-slate-950 p-8 text-white relative border-b border-white/5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">Projetos do Aluno</h3>
                  <p className="text-blue-200/80 dark:text-azul-claro/60 text-xs uppercase font-black tracking-widest mt-1">{selectedStudentForLink.nome}</p>
                </div>
                <button onClick={() => setIsProjectLinkModalOpen(false)} className="text-white/40 hover:text-white transition-colors">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 block mb-2">Vincular a Novo Projeto</label>
                <div className="flex gap-2">
                  <select 
                    id="projectSelect"
                    className="flex-1 p-3 bg-gray-50 dark:bg-slate-800 border-2 border-transparent dark:border-slate-700 rounded-xl outline-none focus:border-azul-claro text-azul-escuro dark:text-white font-bold text-sm transition-all"
                  >
                    <option value="" className="dark:bg-slate-800">Selecione um projeto...</option>
                    {projects
                      .filter(p => !studentLinks.some(l => l.projeto_id === p.id))
                      .map(p => <option key={p.id} value={p.id} className="dark:bg-slate-800">{p.nome}</option>)
                    }
                  </select>
                  <button 
                    onClick={() => {
                      const sel = document.getElementById('projectSelect');
                      if (sel && sel.value) handleAddLink(sel.value);
                    }}
                    className="bg-azul-claro text-white dark:text-azul-escuro px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-md shadow-azul-claro/20"
                  >
                    Vincular
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 block mb-1">Projetos Ativos (Vínculo Direto)</label>
                {studentLinks.length === 0 ? (
                  <p className="text-center py-6 text-gray-400 dark:text-slate-600 text-xs italic bg-gray-50 dark:bg-slate-800/50 rounded-2xl">Nenhum vínculo direto ativo.</p>
                ) : (
                  studentLinks.map(link => (
                    <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-transparent dark:border-slate-800 hover:border-azul-claro/10 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-azul-claro shadow-sm border border-gray-100 dark:border-slate-700">
                          <FolderKanban size={14} />
                        </div>
                        <span className="font-bold text-azul-escuro dark:text-white text-sm">{link.projetos?.nome}</span>
                      </div>
                      <button 
                        onClick={() => handleRemoveLink(link.id)}
                        className="p-2 text-gray-300 dark:text-slate-600 hover:text-vermelho transition-colors"
                        title="Remover Vínculo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
              
              {/* Informação sobre financeiro se existir */}
              {studentProjectMap[selectedStudentForLink.id] && (
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800">
                   <p className="text-[9px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-tighter flex items-center gap-1">
                      <AlertCircle size={10} /> 
                      Este aluno também possui registros financeiros (carnês) em outros projetos.
                   </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 dark:bg-slate-950/50 flex justify-end gap-2 border-t border-white/5">
              <button 
                onClick={() => setIsProjectLinkModalOpen(false)}
                className="px-6 py-2 bg-azul-escuro dark:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
