#!/usr/bin/env node

const ts = require("typescript");
const { globSync } = require("glob");
const path = require("path");
const fs = require("fs");

const OUTPUT_PATH = "interfaces.json";
const interfaceArray = [];

function getDocumentation(node) {
  // Extract JSDoc comments from the node
  const jsDocTags = ts.getJSDocTags(node);
  const comments = [];

  jsDocTags.forEach((tag) => {
    if (tag.comment) {
      comments.push(tag.comment);
    }
  });

  return comments.join("\n");
}

function printInterfaceMembers(node, checker) {
  console.log(`Interface: ${node.name.getText()}`);

  const interfaceObj = {
    name: node.name.getText(),
    attributes: [],
  };

  node.members.forEach((member) => {
    if (ts.isPropertySignature(member) || ts.isMethodSignature(member)) {
      const name = member.name.getText();
      const type = checker.typeToString(checker.getTypeAtLocation(member));
      const documentation = getDocumentation(member);

      console.log(` ${name}: ${type}`);
      console.log(` Documentation: ${documentation}`);

      interfaceObj.attributes.push({
        name,
        type,
        description: documentation, // Store the documentation in the interface object
      });
    }
  });

  console.log(""); // Blank line for readability
  interfaceArray.push(interfaceObj);
}

function getExportedInterfaces(fileName) {
  const program = ts.createProgram([fileName], {});
  const sourceFile = program.getSourceFile(fileName);
  const checker = program.getTypeChecker();

  if (sourceFile) {
    ts.forEachChild(sourceFile, (node) => {
      if (
        ts.isInterfaceDeclaration(node) &&
        node.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword)
      ) {
        printInterfaceMembers(node, checker);
      }
    });
  }
}

function searchInterfaces(globPattern) {
  console.log(globPattern);
  // Resolve the glob pattern and search for files

  const files = globSync(globPattern);

  console.log(files);

  files.forEach((file) => {
    // Loop through the matched files and process each one
    const absolutePath = path.resolve(file);
    console.log(`\nProcessing file: ${absolutePath}`);
    getExportedInterfaces(absolutePath);
  });
  // Write the interfaces to the output file
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(interfaceArray, null, 2));

  // globStream(globPattern, (err, files) => {
  //   if (err) {
  //     console.error("Error occurred while searching files:", err);
  //     return;
  //   }

  //   console.log("files", files);

  //   // Loop through the matched files and process each one
  //   files.forEach((file) => {
  //     const absolutePath = path.resolve(file);
  //     console.log(`\nProcessing file: ${absolutePath}`);
  //     getExportedInterfaces(absolutePath);
  //   });

  //   // Write the interfaces to the output file
  //   fs.writeFileSync(OUTPUT_PATH, JSON.stringify(interfaceArray, null, 2));
  // });
}

// Usage Example
const globPattern = "examples/src/**/*.ts"; // Adjust this glob pattern as needed
searchInterfaces(globPattern);
