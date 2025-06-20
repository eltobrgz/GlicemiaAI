
# GlicemiaAI - Seu Assistente Inteligente para Controle Glicêmico

Bem-vindo ao GlicemiaAI! Este aplicativo foi desenvolvido para auxiliar no monitoramento e gerenciamento da diabetes, combinando registros manuais, análises com Inteligência Artificial e insights personalizados para uma jornada de saúde mais informada e eficaz.

## Sobre o GlicemiaAI

O GlicemiaAI é uma aplicação web moderna construída com Next.js, React, Tailwind CSS e Supabase para o backend e banco de dados, além de Genkit para funcionalidades de IA. Ele permite que usuários registrem seus níveis de glicose, doses de insulina, atividades físicas e analisem refeições com o auxílio da IA para estimar macronutrientes e impacto glicêmico.

## Funcionalidades Principais

### 1. Autenticação Segura
-   **Cadastro e Login:** Crie sua conta de forma segura ou acesse com suas credenciais.
-   **Recuperação de Senha:** Esqueceu sua senha? Um link de redefinição será enviado para seu e-mail.
-   **Alteração de E-mail:** Modifique o e-mail associado à sua conta através das configurações.

### 2. Painel Principal (Dashboard)
Ao fazer login, você é recebido pelo Dashboard, que oferece:
-   **Acesso Rápido:** Atalhos para as funcionalidades mais usadas (Registrar Glicemia, Insulina, Atividade, Analisar Refeição).
-   **Última Glicemia Registrada:** Visualize rapidamente seu último valor de glicemia, com destaque de cor indicando o nível (baixo, normal, alto, muito alto) com base nas suas metas personalizadas.
-   **Última Insulina Registrada:** Veja sua última dose de insulina aplicada.
-   **Teaser de Insights da IA:** Uma prévia de futuras análises e dicas personalizadas pela IA.

### 3. Registros Manuais Detalhados
Mantenha um histórico preciso de seus dados de saúde:
-   **Registrar Glicemia:**
    -   Insira o valor da glicemia (mg/dL).
    -   Data e hora da medição.
    -   Contexto da refeição (antes, depois, jejum, outro).
    -   Notas adicionais.
-   **Registrar Insulina:**
    -   Tipo de insulina administrada.
    -   Dose em unidades.
    -   Data e hora da aplicação.
-   **Registrar Atividade Física:**
    -   Tipo de atividade (caminhada, corrida, etc.).
    *   Duração em minutos.
    *   Data e hora de início.
    *   Intensidade (opcional).
    *   Notas adicionais.

### 4. Análise de Refeição com Inteligência Artificial
-   **Upload de Imagem:** Tire uma foto da sua refeição e envie para análise.
-   **Análise pela IA:** A IA (Google Gemini) analisa a imagem e fornece:
    -   Identificação dos alimentos.
    -   Estimativa de macronutrientes (carboidratos, proteínas, gorduras).
    -   Estimativa do impacto glicêmico.
    -   Sugestão de dose de insulina (considere sempre a orientação médica).
    -   Dicas para melhorar a composição da refeição.
-   **Contexto Adicional:** Forneça informações como sua glicemia atual ou preferências alimentares para uma análise mais personalizada.
-   **Histórico de Análises:** Todas as análises, incluindo a imagem e os resultados, são salvas para consulta futura.

### 5. Calendário de Acompanhamento
Visualize seus registros históricos em um formato de calendário interativo:
-   **Abas Dedicadas:** Glicemia, Insulina e Atividade Física.
-   **Visualização Diária:** Selecione um dia para ver todos os registros correspondentes.
-   **Destaque de Dias com Registros:** Dias com dados são visualmente destacados no calendário.
-   **Gerenciamento:** Apague registros diretamente do calendário.

### 6. Relatórios Detalhados
Gere relatórios para analisar suas tendências ao longo do tempo:
-   **Seleção de Período:** Escolha períodos predefinidos (últimos 7 ou 30 dias, este mês, mês passado) ou um intervalo personalizado.
-   **Dados Compilados:** O relatório inclui dados de glicemia, insulina, atividades físicas e análises de refeição para o período selecionado.
-   **Métricas Chave:**
    -   Glicemia média, mínima e máxima.
    -   Desvio padrão da glicemia.
    -   Tempo no alvo, abaixo e acima da meta glicêmica.
    -   Contagem de eventos de hipoglicemia e hiperglicemia.
    -   Total e média diária de insulina.
    -   Número de aplicações de insulina.
    -   Total de atividades, duração total e média.
    -   Total de refeições analisadas, médias de macronutrientes por refeição.
-   **Gráficos Visuais:**
    -   Tendência da glicemia média diária.
    -   Distribuição do tempo nos alvos glicêmicos (gráfico de pizza).
    -   Tendência da dose total de insulina diária (gráfico de barras).
    -   Tendência da duração total de atividade física diária (gráfico de barras).
-   **Exportação para PDF (em desenvolvimento):** Funcionalidade para exportar o relatório em PDF.

### 7. Perfil do Usuário
Gerencie suas informações pessoais e preferências:
-   **Visualização e Edição:** Atualize seu nome, data de nascimento, tipo de diabetes.
-   **Foto de Perfil:** Faça upload de uma foto para personalizar seu avatar.
-   **Metas Glicêmicas (em breve):** A funcionalidade de definir metas personalizadas de glicemia (hipoglicemia, alvo baixo/alto, hiperglicemia) diretamente no perfil será integrada com a classificação de níveis e relatórios.
-   **Preferência de Idioma:** Defina o idioma para as respostas da IA.

### 8. Lembretes Inteligentes
Configure notificações para não esquecer seus cuidados:
-   **Tipos de Lembrete:** Para medição de glicemia ou aplicação de insulina.
-   **Personalização:**
    -   Nome do lembrete.
    -   Horário específico.
    -   Dias da semana (todos os dias ou dias específicos).
    -   Ativação/Desativação individual.
    -   Para insulina: tipo e dose (opcional, para pré-preenchimento no registro).
-   **Notificações do Navegador:** Requer permissão do usuário. Alertas visuais quando a aba do app está aberta.
-   **Chamada Simulada (Visual):** Opção para exibir a notificação com um estilo visual de "chamada telefônica" (o texto é adaptado para o lembrete).

### 9. Insights da IA (Beta)
Uma seção dedicada a análises e dicas geradas pela IA (atualmente simplificada):
-   **Métricas Resumidas:** Glicemia média, tempo no alvo, tendência glicêmica (comparando os últimos 7 dias com os 7 anteriores).
-   **Estatísticas Recentes:** Resumo de administrações de insulina, atividades físicas e refeições analisadas nos últimos 7 dias.
-   **Gráfico de Tendência Glicêmica:** Visualização da glicemia média nos últimos 7 dias.
-   **Dica Personalizada (Exemplo):** Uma sugestão baseada nos dados recentes, com potencial para evoluir para análises mais complexas.
-   **Aviso:** As faixas de referência para classificação glicêmica podem ser personalizadas no perfil do usuário.

### 10. Configurações do Aplicativo
Ajuste o GlicemiaAI às suas preferências:
-   **Segurança e Conta:**
    -   Opção para redefinir senha (envia e-mail).
    -   Opção para alterar e-mail da conta (com confirmação).
    -   Exportação de dados (funcionalidade pendente).
    -   Sair da conta.
-   **Aparência:**
    -   Modo Escuro/Claro: Alterne entre temas para melhor visualização.
-   **Idioma:**
    -   Selecione o idioma preferido para interações com a IA (ex: análise de refeição).
-   **Notificações:**
    -   Links para gerenciamento detalhado de lembretes.
    -   Controles básicos para ativar/desativar tipos de lembretes (funcionalidade futura).

### 11. Progressive Web App (PWA)
-   **Instalável:** O GlicemiaAI pode ser "instalado" no seu dispositivo (desktop ou mobile) para uma experiência mais próxima a um aplicativo nativo.
-   **Acesso Offline (limitado):** Algumas funcionalidades podem ser acessadas ou dados podem ser armazenados temporariamente para uso offline (dependendo da implementação específica).
-   **Ícones e Tela de Splash:** Configurados para uma boa experiência PWA.

## Como Começar a Usar

1.  **Cadastre-se:** Crie uma nova conta fornecendo seu nome, e-mail e senha. Confirme seu e-mail através do link enviado.
2.  **Faça Login:** Acesse com suas credenciais.
3.  **Explore o Dashboard:** Veja um resumo rápido dos seus dados.
4.  **Registre seus Dados:** Comece a adicionar suas medições de glicemia, doses de insulina e atividades físicas.
5.  **Analise suas Refeições:** Tire fotos das suas refeições e use a IA para obter insights.
6.  **Configure Lembretes:** Não perca medições ou doses importantes.
7.  **Verifique os Relatórios e Insights:** Acompanhe seu progresso e tendências.
8.  **Personalize seu Perfil e Configurações:** Ajuste o app às suas necessidades.

## Configuração Adicional para Funcionalidades de IA (Análise de Refeição)

Para utilizar a funcionalidade de análise de refeição por Inteligência Artificial, você precisará de uma chave de API do Google Gemini.

1.  **Obtenha uma Chave de API:**
    *   Acesse o [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   Crie ou selecione um projeto e gere uma nova chave de API.

2.  **Configure a Variável de Ambiente:**
    *   No seu arquivo `.env.local` (crie um se não existir, na raiz do projeto), adicione a seguinte linha, substituindo `SUA_GEMINI_API_KEY_AQUI` pela chave que você obteve:
        ```env
        GEMINI_API_KEY=SUA_GEMINI_API_KEY_AQUI
        ```
    *   **Importante:** Este arquivo `.env.local` também deve conter suas chaves do Supabase (`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Certifique-se de que TODAS as três variáveis estão presentes no seu `.env.local`.

3.  **Reinicie o Servidor:**
    *   Após adicionar TODAS as chaves necessárias ao `.env.local`, pare e reinicie o servidor de desenvolvimento Next.js.

Sem a `GEMINI_API_KEY`, as chamadas para a IA de análise de refeição resultarão em erro de `FAILED_PRECONDITION` ou similar, indicando a ausência da chave de API.
Sem as chaves `NEXT_PUBLIC_SUPABASE_URL` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY`, a aplicação não conseguirá se conectar ao Supabase e exibirá erros relacionados.

## Configuração do Banco de Dados Supabase

Para configurar as tabelas e as Row Level Security (RLS) policies no seu projeto Supabase, por favor, consulte o arquivo:
[SUPABASE_SETUP_GUIDE.md](docs/supabase/SUPABASE_SETUP_GUIDE.md)
localizado na pasta `docs/supabase/` do seu projeto.
Este guia contém todos os scripts SQL e instruções detalhadas.
