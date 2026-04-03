const fs = require('fs');
const path = require('path');

const files = ['site', 'uniformes'];
files.forEach(f => {
    const filePath = path.join(__dirname, 'assets', `${f}.png`);
    if (fs.existsSync(filePath)) {
        const b64 = fs.readFileSync(filePath).toString('base64');
        console.log(`--- ${f} ---`);
        console.log(`data:image/png;base64,${b64}`);
    } else {
        console.log(`File not found: ${filePath}`);
    }
});
