#!/bin/bash

shopt -s extglob

SCR_NAME_EXEC=$0
SCR_NAME=$(basename $SCR_NAME_EXEC)
SCR_NAME=${SCR_NAME%.*}
RVB_DIR=$HOME/revanced-builder

COLOR_OFF='\033[0m'
COLOR_RED='\033[1;31m'

help_info() {
  cat <<EOF
Usage: $SCR_NAME [command] [options]

Commands:
  run                 Launches the revanced-builder.
                      Running $SCR_NAME_EXEC without arguments will
                      assume this command (i.e. will run the
                      builder).
    --delete-cache    Deletes revanced/ before building.

  reinstall           Delete everything and start from scratch.
    --delete-keystore Delete the signature file also. This will
                      make ReVanced use a different signature,
                      which will not allow you to install an
                      updated build over the previously installed
                      one (you'll need to uninstall that first).

  update              Update the builder to the latest version.

  help                Show this help info.
EOF
}

log() {
  echo -e "[$SCR_NAME] $1"
}

error() {
  log "$1"
  [[ "$2" == y ]] && help_info
  exit ${3:-1}
}

dload_and_install() {
  log "Downloading revanced-builder..."
  curl -sLo revanced-builder.zip https://github.com/reisxd/revanced-builder/archive/refs/heads/main.zip
  log "Unzipping..."
  unzip -qqo revanced-builder.zip
  rm revanced-builder.zip
  mv revanced-builder-main/{.[!.]*,*} .
  log "Installing packages..."
  npm install --omit=dev
  rmdir revanced-builder-main
  [[ -z "$1" ]] && log "Done. Execute \`$SCR_NAME_EXEC run\` to launch the builder."
}

preflight() {
  setup_storage() {
    if [[ ! -d $HOME/storage ]]; then
      log "You will now get a permission dialog to allow access to storage."
      log "This is needed in order to move the built APK (+ MicroG) to Internal Storage."
      sleep 5
      termux-setup-storage
    else
      log "Already gotten storage access."
    fi
  }

  install_dependencies() {
    local JAVA_NF NODE_NF
    which java >/dev/null || JAVA_NF=1
    which node >/dev/null || NODE_NF=1
    if [[ $JAVA_NF != 1 ]] && [[ $NODE_NF != 1 ]]; then
      log "Node.js and JDK already installed."
      return
    fi
    log "Updating Termux and installing dependencies..."
    pkg update -y
    pkg install nodejs-lts openjdk-17 -y || {
      error "$COLOR_RED
Failed to install Node.js and OpenJDK 17.
Possible reasons (in the order of commonality):
1. Termux was downloaded from Play Store. Termux in Play Store is deprecated, and has packaging bugs. Please install it from F-Droid.
2. Mirrors are down at the moment. Try running \`termux-change-repo\`.
3. Internet connection is unstable.
4. Lack of free storage.$COLOR_OFF" n 2
    }
  }
  
  setup_storage
  install_dependencies

  if [[ ! -d $RVB_DIR ]]; then
    log "revanced-builder not installed. Installing..."
    mkdir -p $RVB_DIR
    cd $RVB_DIR
    dload_and_install n
  else
    log "revanced-builder found."
    log "All checks done."
  fi
}

run_builder() {
  preflight
  echo
  if [[ $1 == "--delete-cache" ]]; then
    # Is this even called a cache?
    log "Deleting builder cache..."
    rm -rf $RVB_DIR/revanced
  fi
  cd $RVB_DIR
  node .
}

reinstall_builder() {
  log "Deleting revanced-builder..."
  if [[ $1 != "--delete-keystore" ]]; then
    if [ -f "$RVB_DIR/revanced/revanced.keystore" ]; then
      mv $RVB_DIR/revanced/revanced.keystore $HOME/revanced.keystore
      log "Preserving the keystore. If you do not want this, use the --delete-keystore flag."
      log "Execute \`$SCR_NAME_EXEC help\` for more info."
    fi
  fi
  rm -r $RVB_DIR
  mkdir -p $RVB_DIR
  if [ -f "$HOME/revanced.keystore" ]; then
    log "Restoring the keystore..."
    mkdir -p $RVB_DIR/revanced
    mv $HOME/revanced.keystore $RVB_DIR/revanced/revanced.keystore
  fi
  log "Reinstalling..."
  cd $RVB_DIR
  dload_and_install
}

update_builder() {
  log "Backing up some stuff..."
  if [ -d "$RVB_DIR/revanced" ]; then
    mkdir -p $HOME/revanced_backup
    mv $RVB_DIR/revanced/* $HOME/revanced_backup
  fi
  if [ -f "$RVB_DIR/includedPatchesList.json" ]; then
    mv $RVB_DIR/includedPatchesList.json $HOME/includedPatchesList.json
  fi
  log "Deleting revanced-builder..."
  rm -r $RVB_DIR
  log "Restoring the backup..."
  mkdir -p $RVB_DIR
  if [ -d "$HOME/revanced_backup" ]; then
    mkdir -p $RVB_DIR/revanced
    mv $HOME/revanced_backup/* $RVB_DIR/revanced
  fi
  if [ -f "$HOME/includedPatchesList.json" ]; then
    mv $HOME/includedPatchesList.json $RVB_DIR/includedPatchesList.json
  fi
  log "Updating revanced-builder..."
  cd $RVB_DIR
  dload_and_install
}

main() {
  if [[ -z "$@" ]]; then
    run_builder
  elif [[ $# -gt 2 ]]; then
    error "2 optional arguments acceptable, got $#."
  else
    case $1 in
      run)
        run_builder $2
      ;;
      reinstall)
        reinstall_builder $2
      ;;
      update)
        update_builder
      ;;
      help)
        help_info
      ;;
      *)
        error "Invalid argument(s): $@."
      ;;
    esac
  fi
}

main $@
