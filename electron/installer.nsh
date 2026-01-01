!macro customInstall
  ; Copiar el instalador ejecutado a la carpeta del programa (acceso fácil)
  CopyFiles /SILENT "$EXEPATH" "$INSTDIR\Instalar Cap Finanzas.exe"
  CreateShortCut "$INSTDIR\Instalar Cap Finanzas.lnk" "$INSTDIR\Instalar Cap Finanzas.exe" "" "$INSTDIR\Instalar Cap Finanzas.exe" 0

  ; Crear acceso directo al desinstalador en la carpeta del programa
  CreateShortCut "$INSTDIR\Desinstalar Cap Finanzas.lnk" "$INSTDIR\Uninstall Cap Finanzas.exe" "" "$INSTDIR\Uninstall Cap Finanzas.exe" 0
!macroend

!macro customUnInstall
  ; Eliminar accesos directos/archivos añadidos
  Delete "$INSTDIR\Instalar Cap Finanzas.lnk"
  Delete "$INSTDIR\Instalar Cap Finanzas.exe"
  Delete "$INSTDIR\Desinstalar Cap Finanzas.lnk"
!macroend
