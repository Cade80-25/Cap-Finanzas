const { app } = require('electron');

app.whenReady().then(() => {
  const userData = app.getPath('userData');
  console.log('userData REAL:', userData);
  console.log('app.name:', app.name);
  console.log('app.getName():', app.getName());
  app.quit();
});