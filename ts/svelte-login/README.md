SvelteKit でログイン機能を実装するサンプルコード

## 動かし方

1. Google ログイン用の ClientID/ClientSecret を Google から取得する
   - cf. https://developers.google.com/identity/openid-connect/openid-connect
2. src/lib/server/constants.ts の CLIENT_ID と CLIENT_SECRET を取得した ClientID/ClientSecret で書き換える
3. `docker compose up -d`を実行して DynamoDB Local を起動する
4. `npm install && npm run dev`を実行して SvelteKit を起動する
5. http://localhost:5173 にブラウザでアクセスする
