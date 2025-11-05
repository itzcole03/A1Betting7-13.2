import { Project, SyntaxKind } from "ts-morph";
import fs from "fs";
import path from "path";

const project = new Project();

function parseTypeScriptFile(filePath) {
    const sourceFile = project.addSourceFileAtPath(filePath);
    const components = [];

    // Find all function declarations that look like React components
    sourceFile.getFunctions().forEach(func => {
        if (func.getName() && func.getName().match(/^[A-Z]/)) {
            // Heuristic: check if it returns JSX elements
            if (func.getDescendantsOfKind(SyntaxKind.JsxElement).length > 0 ||
                func.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement).length > 0) {
                const props = func.getParameters().map(param => ({
                    name: param.getName(),
                    type: param.getType().getText()
                }));
                components.push({
                    name: func.getName(),
                    type: 'FunctionalComponent',
                    props: props,
                    filePath: filePath
                });
            }
        }
    });

    // Find all class declarations that extend React.Component
    sourceFile.getClasses().forEach(classDec => {
        const extendsClause = classDec.getExtends();
        if (classDec.getName() && extendsClause && extendsClause.getText().includes('Component')) {
            const props = []; // More complex to extract accurately without deeper analysis
            components.push({
                name: classDec.getName(),
                type: 'ClassComponent',
                props: props,
                filePath: filePath
            });
        }
    });

    return components;
}

async function main() {
    const scannedFilesPath = 
        '/home/ubuntu/A1Betting7-13.2/tools/code_analyzer/scanned_files.json';
    const allFiles = JSON.parse(fs.readFileSync(scannedFilesPath, 'utf8'));

    const tsFiles = allFiles.filter(file => file.endsWith('.ts') || file.endsWith('.tsx'));
    let allComponents = [];

    for (const file of tsFiles) {
        try {
            const componentsInFile = parseTypeScriptFile(file);
            if (componentsInFile.length > 0) {
                allComponents = allComponents.concat(componentsInFile);
            }
        } catch (e) {
            console.error(`Error parsing ${file}: ${e.message}`);
        }
    }

    fs.writeFileSync(
        '/home/ubuntu/A1Betting7-13.2/tools/code_analyzer/frontend_components.json',
        JSON.stringify(allComponents, null, 4)
    );
    console.log(`Extracted ${allComponents.length} components. Details saved to frontend_components.json`);
}

main();


