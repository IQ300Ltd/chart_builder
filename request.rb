require 'net/http'

url = URI.parse('http://localhost:9494')
req = Net::HTTP::Post.new(url.to_s)
res = Net::HTTP.start('localhost', 9494) {|http|
  http.request(req)
}
puts res.body

require 'open-uri'
response = open('http://localhost:9494').read

data = {
data: {
        columns: [
          ['data1', 30, 200, 100, 400, 150, 250],
          ['data2', 50, 20, 10, 40, 15, 25]
        ],
        type: 'bar'
      },
outFile: "chart.png",
inFile: "chart.html",
returnSvg: false
}


uri = URI.parse("http://localhost:9494")
req = Net::HTTP::Post.new(uri, initheader = {'Content-Type' =>'application/json'})
req.body = data.to_json
res = Net::HTTP.start(uri.hostname, uri.port) do |http|
  http.request(req)
end