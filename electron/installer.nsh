!macro customInstall
  ; Crear acceso directo al desinstalador en la carpeta del programa
  CreateShortCut "$INSTDIR\Desinstalar Cap Finanzas.lnk" "$INSTDIR\Uninstall Cap Finanzas.exe" "" "$INSTDIR\Uninstall Cap Finanzas.exe" 0
!macroend

!macro customUnInstall
  ; Eliminar el acceso directo del desinstalador
  Delete "$INSTDIR\Desinstalar Cap Finanzas.lnk"
!macroend
