import { mergeTypeDefs } from '../../epoxy';
import { SchemaLoader } from './schema-loader';
import * as isGlob from 'is-glob';
import * as isValidPath from 'is-valid-path';
import { DocumentNode, parse, Source, Kind } from 'graphql';
import * as glob from 'glob';
import { readFileSync } from 'fs';
import { extractDocumentStringFromCodeFile, ExtractOptions } from '../../utils/extract-document-string-from-code-file';
import zg from 'graphql-import';
console.log('importSchema:', zg);

const GQL_EXTENSIONS = ['.graphql', '.graphqls', '.gql'];
const INVALID_SCHEMA_KINDS: string[] = [Kind.OPERATION_DEFINITION, Kind.FRAGMENT_DEFINITION];

export function isGraphQLFile(globPath: string): boolean {
  return GQL_EXTENSIONS.some(ext => globPath.endsWith(ext));
}

async function loadSchemaFile(filepath: string, options?: ExtractOptions): Promise<string> {
  const content = readFileSync(filepath, 'utf-8');

  console.log(`${filepath}: A`);
  if (content && content.trim() !== '') {
    console.log(`${filepath}: B`);
    if (/^\#.*import /i.test(content.trimLeft())) {
      const { importSchema } = await import('graphql-import');
      console.log(`${filepath}: C`);
      console.log('importSchema!!!:', importSchema);
      //console.log(importSchema(filepath));

      return importSchema(filepath);
    }

    console.log(`${filepath}: D`);
    const foundDoc = await extractDocumentStringFromCodeFile(new Source(content, filepath), options);
    console.log(`${filepath}: E`);

    if (foundDoc) {
      console.log(`${filepath}: F`);
      return foundDoc;
    }

    console.log(`${filepath}: G`);
    if (isGraphQLFile(filepath)) {
      console.log(`${filepath}: H`);
      return content;
    }
  } else {
    console.log(`${filepath}: I`);
    console['warn'](`Empty schema file found: "${filepath}", skipping...`);
  }

  console.log(`${filepath}: E`);
  return null;
}

export class SchemaFromTypedefs implements SchemaLoader {
  canHandle(globOrValidPath: string): boolean {
    return isGlob(globOrValidPath) || isValidPath(globOrValidPath);
  }

  async handle(globPath: string, options?: ExtractOptions): Promise<DocumentNode> {
    let globFiles = glob.sync(globPath, { cwd: process.cwd() });
    // globFiles = [globFiles[11], globFiles[12]];

    if (!globFiles || globFiles.length === 0) {
      throw new Error(`Unable to find matching files for glob: ${globPath} in directory: ${process.cwd()}`);
    }

    console.log('globFiles:', globFiles);
    const filesContent$ = Promise.all(
      globFiles
      .map(async filePath => ({ filePath, content: await loadSchemaFile(filePath, options) }))
    );
    console.log('filesContent length:', (await filesContent$).length);
    // console.log('filesContent 12th element:', (await filesContent$)[12]);
    const filesContent = (await filesContent$)
      .filter(file => {
        console.log('ZG');
        console.log(file);
        if (!file.content) {
          return false;
        }

        let node: DocumentNode;
        try {
          node = parse(file.content);
        } catch (err) {
          console.error(`parse error in ${JSON.stringify(file)}:`, err);
          console.log(`file.content:`, file.content);
          console.log(`file:`, file);
          throw  err;
        }
        const invalidSchemaDefinitions = node.definitions.filter(def => INVALID_SCHEMA_KINDS.includes(def.kind));

        if (invalidSchemaDefinitions.length === 0) {
          return true;
        } else {
          console['warn'](`File "${file.filePath}" was filtered because it contains an invalid GraphQL schema definition!`);

          return false;
        }
      });

    if (filesContent.length === 0) {
      throw new Error(`All found files for glob expression "${globPath}" are not valid or empty, please check it and try again!`);
    }

    return mergeTypeDefs(filesContent.map(f => f.content));
  }
}
