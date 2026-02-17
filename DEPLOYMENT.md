# AWS Deployment Guide (Production)

This guide deploys the project with:
- **EC2** for API (`server`)
- **S3 + CloudFront** for `client` and `admin` static apps
- **Route 53 + ACM** for DNS and TLS
- **MongoDB Atlas** for database

---

## 1) Recommended architecture

- `api.yourdomain.com` → **EC2** (Node.js + PM2 + Nginx reverse proxy)
- `app.yourdomain.com` → **CloudFront** → **S3** (`client/dist`)
- `admin.yourdomain.com` → **CloudFront** → **S3** (`admin/dist`)
- MongoDB in Atlas with IP access restricted to EC2 Elastic IP.

---

## 2) Prepare AWS resources

### EC2
1. Launch Ubuntu 22.04 (t3.small or higher for production).
2. Attach an Elastic IP.
3. Security Group:
   - 22 (SSH) from your IP only
   - 80 (HTTP) from all
   - 443 (HTTPS) from all
   - **Do not expose 5000 publicly** (Nginx will proxy locally).

### ACM + Route 53
1. Request certificates for:
   - `api.yourdomain.com`
   - `app.yourdomain.com`
   - `admin.yourdomain.com`
2. Validate via Route 53 DNS.

### S3 + CloudFront
1. Create two buckets:
   - `app.yourdomain.com`
   - `admin.yourdomain.com`
2. Keep bucket private, use CloudFront Origin Access Control.
3. Configure CloudFront behaviors for SPA fallback (`index.html`).

---

## 3) Deploy backend on EC2

SSH into EC2:

```bash
ssh -i /path/to/key.pem ubuntu@<EC2_ELASTIC_IP>
```

Install runtime:

```bash
sudo apt update
sudo apt install -y nginx git curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2
```

Clone and install:

```bash
git clone <your-repo-url> attendify
cd attendify/server
npm ci
```

Create server env file (`server/.env`):

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=<mongo-atlas-uri>
JWT_SECRET=<strong-secret>
JWT_EXPIRY=7d
CLIENT_URL=https://app.yourdomain.com
ALLOWED_ORIGINS=https://app.yourdomain.com,https://admin.yourdomain.com
DEFAULT_ADMIN_EMAIL=admin@yourdomain.com
DEFAULT_ADMIN_PASSWORD=<temporary-strong-password>
DEFAULT_ADMIN_NAME=System Admin
IMAGEKIT_PUBLIC_KEY=<...>
IMAGEKIT_PRIVATE_KEY=<...>
IMAGEKIT_URL_ENDPOINT=<...>
```

Start with PM2:

```bash
pm2 start index.js --name attendify-api
pm2 save
pm2 startup
```

Nginx reverse proxy (`/etc/nginx/sites-available/attendify-api`):

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/attendify-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Add TLS with Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

## 4) Build and deploy frontend apps

From project root:

```bash
cd client
npm ci
VITE_API_URL=https://api.yourdomain.com VITE_SOCKET_URL=https://api.yourdomain.com npm run build
aws s3 sync dist/ s3://app.yourdomain.com --delete

cd ../admin
npm ci
VITE_API_URL=https://api.yourdomain.com VITE_SOCKET_URL=https://api.yourdomain.com npm run build
aws s3 sync dist/ s3://admin.yourdomain.com --delete
```

Create CloudFront distributions for each bucket and attach ACM certificates.

---

## 5) DNS records

In Route 53:
- `api` CNAME/Alias → EC2/NLB (or CloudFront if you front API too)
- `app` Alias → CloudFront distribution for client
- `admin` Alias → CloudFront distribution for admin

---

## 6) Operational checklist

- Enable CloudWatch agent on EC2
- Keep PM2 logs rotated (`pm2 install pm2-logrotate`)
- Set backup/alerts for MongoDB Atlas
- Enable AWS WAF on CloudFront distributions
- Rotate secrets and avoid committing `.env` / `.pem`

---

## 7) Useful commands

```bash
pm2 status
pm2 logs attendify-api
sudo systemctl status nginx
curl -I https://api.yourdomain.com/health
```
