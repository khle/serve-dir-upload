const handler = require("serve-handler")
const http = require("http")
const fs = require("fs-extra")
const formidable = require("formidable")
const template = require("lodash.template")

// html file containing upload form
const upload_html = fs.readFileSync("upload_file.html")
const index_html = fs.readFileSync("index.html")
const result_template = fs.readFileSync("result_template.txt")

// replace this with the location to save uploaded files
const servePath = process.env.SERVE_PATH

const server = http.createServer((request, response) => {
  if (request.url == "/") {
    response.writeHead(200)
    response.write(index_html)
    return response.end()
  } else if (request.url === "/_list" || request.url === "/_list/") {
    request.url = "/"
    return handler(request, response, {
      public: servePath,
      unlisted: ["simple_http_server.py"],
    })
  } else if (request.url == "/_upload" || request.url == "/_upload/") {
    response.writeHead(200)
    response.write(upload_html)
    return response.end()
  } else if (
    (request.url == "/_doupload" || request.url == "/_doupload/") &&
    request.method === "POST"
  ) {
    const form = new formidable.IncomingForm()
    form.parse(request, (_err, _fields, files) => {
      const tempUploadedPath = files.filetoupload.path
      const finalUploadedPath = `${servePath}/${files.filetoupload.name}`

      fs.move(tempUploadedPath, finalUploadedPath, (err) => {
        if (err) {
          const compiled = template(result_template)
          const resultHtml = compiled({
            uploadedFile: files.filetoupload.name,
            resultUploadingFile: err.toString(),
          })

          response.writeHead(200)
          response.write(resultHtml)
          response.end()
        } else {
          const compiled = template(result_template)
          const resultHtml = compiled({
            uploadedFile: files.filetoupload.name,
            resultUploadingFile: "File uploaded successfully",
          })

          response.writeHead(200)
          response.write(resultHtml)
          response.end()
        }
      })
    })
  } else {
    return handler(request, response, {
      public: servePath,
      unlisted: [], //hide any file listed that's here
    })
  }
})

server.listen(process.env.PORT, () => {
  console.log(`Server running @ http://localhost:${process.env.PORT}`)
})
