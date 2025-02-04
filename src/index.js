const express = require("express");
const MongoClient = require('mongodb').MongoClient;
const assert = require("assert");
const path = require("path");
const uri = "mongodb+srv://vietnguyen:500anhem@cluster0.6z4y7rp.mongodb.net/?retryWrites=true&w=majority";
const home = require('./Router/home.js');
const app = express();
//const bodyParser = require("body-parser");

const client = new MongoClient(uri);
app.set("port", process.env.PORT || 10000);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
//app.use(bodyParser.urlencoded({ extended: false }));
app.use("/",home);

const start = async () => {
  try {
    await client.connect( function (err) {
        assert.equal(null, err);
        console.log("connect suscessful");
    })
      app.listen(app.get("port"), function () {
        console.log("server started on port " + app.get("port"));
      });
  } catch (error) {
      console.log(error);
      console.log("Failed to connect to the database, server is not running.");
  }
};
start();


const mqtt = require("mqtt");

const host = "broker.emqx.io";
const port = "1883";
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;

const connectUrl = `mqtt://${host}:${port}`;
const client_mqtt = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: "emqx",
  password: "public",
  reconnectPeriod: 1000,
});

const topic_mq7 = "esp32_pub_mq7";
const topic_humi = "esp32_pub_humi";
const topic_temp = "esp32_pub_temp";
const topic_pm25 = "esp32_pub_pm25";
client_mqtt.on("connect", () => {
  console.log("Connected");
  client_mqtt.subscribe([topic_mq7], () => {
    console.log(`Subscribe to topic '${topic_mq7}'`);
  });
  client_mqtt.subscribe([topic_humi], () => {
    console.log(`Subscribe to topic '${topic_humi}'`);
  });
  client_mqtt.subscribe([topic_temp], () => {
    console.log(`Subscribe to topic '${topic_temp}'`);
  });
  client_mqtt.subscribe([topic_pm25], () => {
    console.log(`Subscribe to topic '${topic_pm25}'`);
  });
});

client_mqtt.on("message", (topic, payload) => {
  MongoClient.connect(uri, async function (err, db) {
    if (err) throw err;
    var dbo = db.db("mydb");
    switch (topic) {
      case topic_mq7:
        var myobj = { Device: 'esp32', topic: topic_mq7, Value: payload.toString(), Unit: "ppm", Time: new Date() };
         await dbo.collection("data_mq7").insertOne(myobj, function (err, res) {
          if (err) throw err;
          db.close();
        });
        break;
      case topic_humi:
        var myobj = { Device: 'esp32', topic: topic_humi, Value: payload.toString(), Unit: "%", Time: new Date() };
        await dbo.collection("data_humi").insertOne(myobj, function (err, res) {
          if (err) throw err;
          db.close();
        });
        break;
      case topic_temp:
        var myobj = { Device: 'esp32', topic: topic_temp, Value: payload.toString(), Unit: "°C", Time: new Date() };
        await dbo.collection("data_temp").insertOne(myobj, function (err, res) {
          if (err) throw err;
          db.close();
        });
        break;
        case topic_pm25:
          var myobj = { Device: 'esp32', topic: topic_pm25, Value: payload.toString(), Unit: "µm/m3", Time: new Date() };
          await dbo.collection("data_pm25").insertOne(myobj, function (err, res) {
            if (err) throw err;
            db.close();
          });
          break; 
    }
  });
});