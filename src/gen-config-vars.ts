
import { createReadStream, createWriteStream } from "fs"
import { resolve } from "path"
import { createInterface } from "readline"

// TYPES

type VarObj = {
  Name: string,
  Value: string | number | null,
}

// CONSTANTS

const GEN_FILE = "./my-config-vars.ts"

const GEN_TPL = `
/**
 * This File is auto-generated.
 * Change your variables from the original file instead, then run \`genConfigVars()\`
 */

export default {
%s
}
`
// FUNCTIONS

const AssertNumeric = (val: number|string): boolean => {
  return (/^-?\d*\.?\d+$/).test(val as unknown as string)
}

const genConfigVars = (varsPath: string, dirname: string = __dirname) => {
  const vars: VarObj[] = []
  const varsFile = resolve(dirname, varsPath)
  const readStream = createReadStream(varsFile)
  const readInterface = createInterface(readStream)

  const generate = (res: () => void) => {
    readInterface
      .on("line", (line) => {
        if ( line.includes("=") ) {
          const value = line.split("=")[1]

          vars.push({
            Name: line.split("=")[0],
            Value: (value.length
                ? ( AssertNumeric(value) ? Number(value) : String(value) )
                : null
              ),
          })
        }
      })
      .on("close", () => {
        const varsStr = vars
          .sort((prev: VarObj, next: VarObj) => {
            return prev.Name < next.Name ? -1 : 1
          })
          .map((v) => {
            const val = typeof v.Value === typeof "" ? `"${v.Value}"` : String(v.Value)
            return `  ${v.Name}: ${val},`
          })
          .join("\n")

        const content = GEN_TPL.replace("%s", varsStr)
        const genFile = resolve(dirname, GEN_FILE)
        const writeStream = createWriteStream(genFile)
        writeStream.write(content)
        writeStream.close()
        res()
      })
  }

  return new Promise(generate)
}

export default genConfigVars
