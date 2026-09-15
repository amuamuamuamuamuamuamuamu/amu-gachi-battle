/* Local adapter for the QR renderer already loaded by index.html. */
(function (global) {
  if (typeof global.qrcode === 'function') return;
  if (typeof global.QRCode !== 'function') return;
  global.qrcode = function () {
    var value = '';
    return {
      addData: function (text) { value = String(text); },
      make: function () {},
      createImgTag: function () {
        var holder = document.createElement('div');
        new global.QRCode(holder, { text: value, width: 220, height: 220, colorDark: '#000000', colorLight: '#ffffff' });
        return holder.innerHTML;
      }
    };
  };
})(window);
