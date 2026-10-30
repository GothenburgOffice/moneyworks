import path from 'node:path';
import ts from 'typescript';

export function inspectPresentationSource(source, filename) {
  const ast = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
  const violations = [];
  const root = path.resolve('src');
  function checkImport(specifier) {
    const target = specifier.startsWith('@/') ? path.join(root, specifier.slice(2))
      : specifier.startsWith('.') ? path.resolve(path.dirname(filename), specifier) : null;
    if (!target) return;
    const relative = path.relative(root, target).replaceAll('\\', '/');
    if (/^lib\/(?:db|auth(?:-[^/]+)?)(?:\.[cm]?[jt]sx?)?$/.test(relative)
      || relative.startsWith('generated/')) violations.push(`server import: ${specifier}`);
  }
  function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
      && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      checkImport(node.moduleSpecifier.text);
    }
    if (ts.isCallExpression(node)
      && (node.expression.kind === ts.SyntaxKind.ImportKeyword
        || (ts.isIdentifier(node.expression) && node.expression.text === 'require'))
      && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
      checkImport(node.arguments[0].text);
    }
    if ((ts.isPropertyAccessExpression(node)
      && ts.isIdentifier(node.expression) && node.expression.text === 'process' && node.name.text === 'env')
      || (ts.isElementAccessExpression(node)
        && ts.isIdentifier(node.expression) && node.expression.text === 'process'
        && node.argumentExpression && ts.isStringLiteral(node.argumentExpression)
        && node.argumentExpression.text === 'env')) violations.push('environment access');
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return violations;
}
