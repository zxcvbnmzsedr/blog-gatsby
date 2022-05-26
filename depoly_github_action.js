const fs = require('fs')

fs.mkdirSync('./public/.github')
fs.mkdirSync('./public/.github/workflow')
const flowData =
    `
name: CI
on:
  workflow_dispatch:
  push:
    branches:
      - master
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout master
        uses: actions/checkout@v2
        with:
          ref: master
      - name: Upload COS
        uses: zkqiang/tencent-cos-action@v0.1.0
        with:
          args: delete -r -f / && upload -r ./ /
          secret_id: \${{secrets.COS_SECRET_ID}}
          secret_key: \${{secrets.COS_SECRET_KEY}}
          bucket: \${{secrets.COS_BUCKET}}
          region: \${{secrets.COS_REGION}}
`
fs.writeFileSync('./public/.github/workflow/tencentCloud.yml', flowData)
