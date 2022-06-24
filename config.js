module.exports = {
  valine: {
    appId: process.env.VALINE_APPID || '<valine.APPID>',
    appKey: process.env.VALINE_APPKEY || '<valine.APPKEY>'
  },
  google: {
    trackingId: 'G-MEZSZT13C9'
  },
  siYuan: {
    host: process.env.SIYUAN_HOST || 'http://127.0.0.1:6806/api/',
    token: process.env.SIYUAN_TOKEN || '<token>',
    box: process.env.SIYUAN_BOX || '20220420112442-p6q6e8w'
  }
}
