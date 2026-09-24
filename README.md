# Contador de Cilindros de Gases 🛢️⚡

> Aplicativo progressivo, moderno e de alta performance desenvolvido para controle de estoque, conferência de turno e inventário ágil de cilindros de gases industriais, medicinais e especiais.

---

## 📌 Visão Geral

O **Contador de Cilindros de Gases** foi concebido sob o princípio de usabilidade de chão de fábrica: **"Menos é mais"**. Em ambientes industriais e hospitalares, os operadores utilizam smartphones com luvas ou precisam realizar a conferência visual e física de dezenas de cilindros de maneira rápida, sem atritos ou interfaces complexas.

A aplicação elimina planilhas de papel e anotações manuais, proporcionando cálculo instantâneo de saldos, modo de conservação de cilindros (troca 1x1), alertas de estoque mínimo, backup local, histórico com snapshots e múltiplos formatos de exportação para **WhatsApp** e planilhas **CSV**.

---

## ✨ Principais Funcionalidades

### 1. 🔄 Modo Troca (Total Fixo de Cilindros)
- **Conservação de Total**: Mantém a equação `Total = Cheios + Vazios` constante para cada gás.
- **Operação Direta**:
  - `+ Cheios`: Transfere 1 vazio para cheio (`+1 Cheio / -1 Vazio`).
  - `- Cheios`: Retira 1 cheio em uso (`-1 Cheio / +1 Vazio`).
  - `+ Vazios`: Cilindro esvaziado no pátio (`-1 Cheio / +1 Vazio`).
  - `- Vazios`: Cilindro recolhido/recarregado (`+1 Cheio / -1 Vazio`).
- **Edição Numérica Sincronizada**: Ao editar diretamente pelo teclado, o valor complementar é ajustado sem quebrar o saldo do parque de cilindros.
- **Modo Livre**: Quando o modo troca está desmarcado, os contadores funcionam de maneira livre e independente para inventários iniciais.

### 2. 📋 Exportação e Compartilhamento Avançado
- **WhatsApp Formatado (Padrão)**: Gera tabelas monospaçadas limpas com cabeçalho de metadados (local, responsável, turno, data/hora) prontas para visualização em grupos.
- **Tabela Completa (ASCII)**: Grade técnica delimitada com alinhamento preciso de colunas.
- **Imagem PNG (Canvas)**: Exportação gráfica com tabela completa de cilindros (Cheios, Vazios, Total, Local, Responsável e Turno) pronta para download e compartilhamento no WhatsApp. Módulo isolado (`/src/utils/canvasExport.ts`) preparado para fácil customização visual.
- **Texto Simples**: Listagem direta e concisa (uma linha por gás).
- **Opções de Exportação Flexíveis**: Checkboxes para incluir saldo zerado, observações detalhadas, indicador visual de **estoque de cheios baixo** (`⚠️ [BAIXO]` / `🚨 [ZERADO!]`) e arquivamento automático no histórico.
- **Modelo Personalizado**: Suporte a tags dinâmicas (`{local}`, `{responsavel}`, `{turno}`, `{data}`, `{hora}`, `{itens}`, `{estoque_baixo}`, `{alertas}`, `{total_cheios}`, `{total_vazios}`, `{total_geral}`).
- **Edição Pré-Envio**: Permite ajustar o texto gerado diretamente no editor antes de copiar ou compartilhar.
- **Download em CSV**: Arquivo estruturado compatível com Excel e LibreOffice com codificação UTF-8 BOM.
- **Copiar Individual por Gás**: Botão rápido em cada card para copiar apenas o saldo daquele item.

### 3. 🎯 Interface Otimizada para Campo
- **Touch Targets Generosos**: Botões grandes com resposta tátil (`active:scale-95`) para fácil acionamento em telas sensíveis ao toque.
- **Código de Cores Industrial**: Identificação por tipo de gás e conformidade de segurança (Oxigênio, Acetileno, Argônio, Nitrogênio, etc.).
- **Alertas de Estoque Crítico**: Sinalização visual imediata quando os cilindros cheios atingem ou caem abaixo da cota mínima configurada.
- **Tema Claro e Escuro**: Alternância suave entre Dark/Light mode com persistência de preferência.
- **Favoritos e Busca Rápida**: Filtros instantâneos por texto e fixação dos gases de maior giro no topo.

### 4. 🗄️ Histórico de Contagens & Snapshots
- **Salvamento Automático**: Arquivamento de snapshots a cada exportação ou fechamento de turno.
- **Comparativo Temporal**: Registro do histórico com data, hora, responsável, local e resumo quantitativo.
- **Restauração e Consulta**: Visualização detalhada de contagens anteriores.

---

## 🛠️ Tecnologias Utilizadas

- **Framework**: [React 19](https://react.dev/) com [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vite.dev/)
- **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Animações**: [Motion](https://motion.dev/)
- **Persistência**: LocalStorage com serialização defensiva e fallback para clipboard API

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- **Node.js**: Versão 18 ou superior
- **npm** ou gerenciador de pacotes equivalente

### Instalação

1. Clone o repositório ou baixe os arquivos do projeto:
```bash
git clone <url-do-repositorio>
cd contador-cilindros-gases
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```
O aplicativo estará acessível em `http://localhost:3000`.

### Scripts Disponíveis

- `npm run dev`: Inicia o ambiente de desenvolvimento com Vite.
- `npm run build`: Compila os assets estáticos para produção na pasta `dist/`.
- `npm run lint`: Executa a verificação estática de tipos do TypeScript (`tsc --noEmit`).
- `npm run preview`: Executa a prévia da build de produção localmente.

---

## 📂 Estrutura do Projeto

```text
├── src/
│   ├── components/            # Componentes modulares da interface
│   │   ├── AddCounterModal.tsx        # Cadastro de novos tipos de gases
│   │   ├── ConfirmModal.tsx           # Modais de confirmação de exclusão/reset
│   │   ├── CounterCard.tsx            # Card individual com botões grandes e cópia
│   │   ├── ExportModal.tsx            # Modal com 4 formatos de texto e CSV
│   │   ├── Header.tsx                 # Barra superior com busca, tema e ações
│   │   ├── HistoryModal.tsx           # Histórico de contagens e snapshots
│   │   ├── MetricsBar.tsx             # Resumo geral e switch do Modo Troca
│   │   ├── ResetIndividualModal.tsx   # Modal de zeramento seletivo
│   │   └── ToastContainer.tsx         # Notificações contextuais
│   ├── constants/             # Cores e configurações padrão de fábrica
│   ├── hooks/                 # Custom hooks (tema, atalhos, etc.)
│   ├── types/                 # Definições de tipos TypeScript (GasCounter, ExportSettings)
│   ├── utils/                 # Formatadores de texto, exportação e clipboard
│   ├── App.tsx                # Orquestração do estado e fluxo da aplicação
│   ├── index.css              # Configuração do Tailwind CSS
│   └── main.tsx               # Ponto de entrada do React
├── metadata.json              # Configurações do ecossistema AI Studio
├── package.json               # Dependências e scripts do projeto
├── vite.config.ts             # Configuração do Vite
└── README.md                  # Documentação do projeto
```

---

## 📄 Licença

Este projeto é de uso livre para fins operacionais, logísticos e educacionais.
Desenvolvido com foco em produtividade, segurança e simplicidade operacional.
