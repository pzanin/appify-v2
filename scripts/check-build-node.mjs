const [major,minor,patch]=process.versions.node.split('.').map(Number);
const supported=(major===22&&(minor>22||(minor===22&&patch>=2))) || (major===24&&minor>=15) || major>=26;
if(!supported){console.error(`Node ${process.versions.node} não é suportado para gerar o instalador. Atualize para Node 24 LTS (24.15 ou superior): https://nodejs.org/`);process.exitCode=1;}
