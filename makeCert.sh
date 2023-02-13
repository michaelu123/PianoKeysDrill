cd config/ssl
openssl genrsa -out ca.key 2048
openssl req -x509 -new -nodes -key ca.key -sha256 -days 10000 -out ca.pem
openssl genrsa -out site.key 2048
openssl req -new -key site.key -out site.csr

>site.ext 
cat <<-EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names
[alt_names]
IP.1 = 192.168.178.41
IP.2 = 127.0.0.1
DNS.1 = localhost
DNS.2 = localhost.local
DNS.3 = muhct
EOF

openssl x509 -req -in site.csr -CA ca.pem -CAkey ca.key -CAcreateserial -out site.crt -days 10000 -sha256 -extfile site.ext
openssl dhparam -out dhparam.pem 2048
