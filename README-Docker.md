MqttAlerter Docker Container
=======================

Containerized mqttAlerter.js program.

1. Buld the Container.
I have included my own build script, but use what works for you.

<pre>
# Bump version number & build
VERSION=$(cat VERSION | perl -pe 's/^((\d+\.)*)(\d+)(.*)$/$1.($3+1).$4/e' | tee VERSION)
docker build -t jdallen/mqttalerter:$VERSION -t jdallen/mqttalerter:latest .
</pre>

2. Run the Container.

<pre>
docker run -d --restart=always \
  --name=mqttalerter \
  --volume /root/Docker/mqttAlerter:/mqtt/config \
  jdallen/mqttalerter:latest
</pre>

The config.json file goes into your volume directory.


