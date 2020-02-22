const path = require("path");
const https = require("https");
const fs = require("fs");
const cheerio = require("cheerio");
const movies = [];

function spiderMovie(index) {
	https
		.get("https://movie.douban.com/top250?start=" + index, function(res) {
			let html = "";
			res.setEncoding("utf-8");
			res.on("data", function(chunk) {
				html += chunk;
			});
			res.on("end", function() {
				const $ = cheerio.load(html);
				$("div .item").each(function() {
					const movie = {
						title: $(".title", this).text(),
						star: $(".info .star .rating_num", this).text(),
						link: $(".info .hd a", this).attr("href"),
						picUrl: $(".pic img", this).attr("src")
					};
					movies.push(movie);
					if (!fs.existsSync(path.join(__dirname, "/images/"))) {
						fs.mkdir(path.join(__dirname, "/images/"), err => {
							if (err) {
								throw err;
							}
						});
					}
					downloadImg(path.join(__dirname, "/images/"), movie.picUrl);
					saveData(path.join(__dirname, "/movies.json"), movies);
				});
			});
		})
		.on("error", function(e) {
			console.log(e.message);
		});
}

function downloadImg(imgDir, url) {
	https
		.get(url, function(res) {
			let data = "";
			res.setEncoding("binary");
			res.on("data", chunk => {
				data += chunk;
			});
			res.on("end", () => {
				fs.writeFile(
					imgDir + path.basename(url),
					data,
					"binary",
					function(err) {
						if (err) {
							console.log(err);
							return;
						}
					}
				);
			});
		})
		.on("error", function(e) {
			console.log(e.message);
		});
}

function saveData(dataPath, movies) {
	movies = JSON.stringify(movies, null, " ");
	fs.writeFile(dataPath, movies, function(err) {
		if (err) {
			console.log(err.message);
			return;
		}
	});
}

function* start(index) {
	let currentIndex = 0;
	console.log("start--------------");
	while (currentIndex < index) {
		yield currentIndex;
		spiderMovie(currentIndex);
		currentIndex += 25;
	}
	console.log("100% finished");
	console.log("end--------------");
}

for (let i of start(250)) {
	console.log(`${(i / 250) * 100}% finished`);
}
