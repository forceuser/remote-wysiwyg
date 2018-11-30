localRepo=$1
remoteRepo=$2
subDir=$3


# Create local repository for subdirectory checkout, make it hidden to avoid having to drill down to the subfolder
mkdir ./$localRepo
cd ./$localRepo
git init
git remote add -f origin $remoteRepo
git config core.sparseCheckout true

# Add the subdirectory of interest to the sparse checkout.
echo $subDir >> .git/info/sparse-checkout

git pull origin master
