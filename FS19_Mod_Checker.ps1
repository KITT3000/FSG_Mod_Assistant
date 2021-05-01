param (
	[switch]$showonlyloaded = $false
)
<#
 _______           __ ______ __                __               
|   |   |.-----.--|  |      |  |--.-----.----.|  |--.-----.----.
|       ||  _  |  _  |   ---|     |  -__|  __||    <|  -__|   _|
|__|_|__||_____|_____|______|__|__|_____|____||__|__|_____|__|  
                                              v1.0.0.0 by JTSage
#> 

### Change this to where your savegames are.
$modPath = "~\Documents\My` Games\FarmingSimulator2019\mods"

$savePath = "~\Documents\My` Games\FarmingSimulator2019\"


## DO NOT EDIT BELOW THIS LINE!!


$modFileListType = @{};
$modFileListLoad = @{};
$modFileListUsed = @{};

$modsAreGood = $true

$specialCases = @('FS19_holmerPack')

$sepLine = "-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-"

$Esc=[char]0x1b 
$DANGER = "$Esc[91mDANGER$Esc[0m:"
$ERRORF = "$Esc[91mFATAL ERROR$Esc[0m:"
$WARNING = "$Esc[93mWARNING$Esc[0m:"
$SUGGEST = "$Esc[96mSUGGESTION$Esc[0m:"
$SUCCESS = "$Esc[92mSUCCESS$Esc[0m:"

$Logfile = "FS19_Used_Mods.log"
Set-Content $LogFile -value ""
Function LogWrite
{
	Param ([string]$logstring)
	Add-content $Logfile -value $logstring
}
Function BothArrayIndent {
	Param([array]$outty)
	foreach ( $thisOut in $outty ) {
		Write-Host "  $thisOut"
		LogWrite("  $thisOut")
	}
}
Function BothOutput {
	Param ([string]$logstring)
	Add-content $Logfile -value $logstring
	Write-Host $logstring
}

$banner = -join(
	" _______           __ ______ __                __               `n",
	"|   |   |.-----.--|  |      |  |--.-----.----.|  |--.-----.----.`n",
	"|       ||  _  |  _  |   ---|     |  -__|  __||    <|  -__|   _|`n",
	"|__|_|__||_____|_____|______|__|__|_____|____||__|__|_____|__|  `n",
	"                                              v1.0.0.0 by JTSage`n",
	$sepLine
)

BothOutput($banner)

# Give some information to the user.
Write-Host "$Esc[93mNOTE$Esc[0m: this does not in any way alter your mod files or your savegame.  To correct any problems"
Write-Host "found, you must manually follow the suggestions below."
Write-Host ""
Write-Host "To output those mods that are loaded but never used, use the `"-showonlyloaded`" switch"
Write-Host ""
Write-Host "This information is saved to the $Logfile file in the current directory"
Write-Host $sepLine


# Assume that you have the giants free DLC(s).  Only one at this time, but plan
# for the furtre.
foreach ( $thisSpecial in $specialCases ) {
	$modFileListType.add($thisSpecial,"zip")
	$modFileListLoad.add($thisSpecial,$false)
	$modFileListUsed.add($thisSpecial,$false)
}

## Check to see if the mod path we were given above is valid.  If not, fail exit.
if (Test-Path -Path $modPath) {
	Write-Host "Pulling all mods from your mods folder..."
	Write-Host $sepLine
} else {
	Write-Host "$ERRORF Mod Path Does Not Exist, can't find anything!"
	exit 1
}

LogWrite("Mod Folder Test Results:")

# Append zip extension to find zipped mods
$zipModPath = -join($modPath, "\*.zip")

# Find all zipped mods.  Print a rejection notice for any that do not follow proper naming conventions.
Get-ChildItem $zipModPath |
	Where-Object { !$_.psiscontainer} | 
	ForEach-Object {
		$realName = $_.name.TrimEnd(".zip")
		$fail = $false
		if ( $realName -match '\W' ) {
			$fail = $true
			$modsAreGood = $false
			Write-Host "$DANGER `"$realName.zip`" is not a valid mod file, and will not load in-game!"
			Write-Host "  $SUGGEST delete or rename `"$realName.zip`""
			Write-Host ""
			LogWrite("  DANGER: `"$realName.zip`" is not a valid mod file. Delete or rename required")
		}
		if ( !$fail -And $realName -match '^[0-9].+' ) {
			$modsAreGood = $false
			Write-Host "$DANGER `"$realName.zip`" is not a valid mod file, and will not load in-game!"
			Write-Host "  $SUGGEST delete or rename `"$realName.zip`""
			Write-Host ""
			LogWrite("  DANGER: `"$realName.zip`" is not a valid mod file. Delete or rename required")
		}
		$modFileListType.add($realName,"zip")
		$modFileListLoad.add($realName,$false)
		$modFileListUsed.add($realName,$false)
	}

# Find all unzipped mods, print an error for any that don't follow the naming conventions.
# Additionally, print a warning that unzipped mods cannot be using in multiplayer, and suggest
# that the user zip them appropriatly.
Get-ChildItem -Directory $modPath |
	Where-Object { {$_.PSIsContainer} } | 
	ForEach-Object { 
		$fail = $false
		if ($_.name -match '\W' ) {
			$fail = "TRUE"
			$modsAreGood = $false
			Write-Host "$DANGER `"$_`" is not a valid mod folder, and will not load in-game!"
			Write-Host "  $SUGGEST delete or rename `"$_`""
			Write-Host ""
			LogWrite("  DANGER: `"$_`" is not a valid mod folder. Delete or rename required")
		}
		if ( !$fail ) {
			$modsAreGood = $false
			Write-Host "$WARNING `"$_`" is not zipped, and cannot be used in multi-player"
			Write-Host "  $SUGGEST pack this folder into a zip file"
			Write-Host ""
			LogWrite("  WARNING: `"$_`" is not zipped, and cannot be used in multiplayer")
		}
		
		$modFileListType.add($_.name,"folder")
		$modFileListLoad.add($_.name,$false)
		$modFileListUsed.add($_.name,$false)
	}


if ( $modsAreGood) {
	Write-Host "$SUCCESS Your mod folder is clean of any invalid mod files or folders."
	LogWrite("  No Problems Found")
} else {
	Write-Host $sepLine
	Write-Host "$WARNING You have invalid mods to correct."
}

BothOutput($sepLine)


# Check to make sure we can actually read the savegames.
if (Test-Path -Path $savePath) {
	Write-Host "Pulling all saved games from your savegames folder..."
	Write-Host $sepLine
} else {
	Write-Host "$ERRORF Savegame Path Does Not Exist, can't find anything!"
	exit 1
}

# Add the appropriate paths and file names to the save paths.
$vehiclePath = -join($savePath, "savegame*\vehicles.xml")
$careerPath  = -join($savePath, "savegame*\careerSavegame.xml")

$badLoads = @()
$badUses = @()

# Load a list of vehicle.xml and careerSavegame.xml files
$saveGameVehicles = Get-ChildItem $vehiclePath |
	Where-Object { !$_.psiscontainer} | 
	ForEach-Object { $_.FullName }

$saveGameCareer = Get-ChildItem $careerPath |
	Where-Object { !$_.psiscontainer} | 
	ForEach-Object { $_.FullName }

# We need to do "loaded" mods first, or we will overwrite the used status later.
foreach ( $thisCareerFile in $saveGameCareer ) {
	Select-Xml -Path $thisCareerFile -XPath '/careerSavegame/mod' |
		ForEach-Object { 
			$thisModName = $_.Node.modName
			if ( !$thisModName ) {
				# Skipping Blank entries.  Usually part of the map.
				return
			}
			if ( $thisModName -match '^pdlc' ) {
				# Skipping DLC files
				return
			} 
			if ($modFileListType.ContainsKey($thisModName)) {
				$modFileListLoad[$thisModName] = $true
			} else {
				# Track loaded mods that don't exist in the mods folder.
				$badLoads += $thisModName
			}
		}
}

# Lets do the vehicles last.  This is for vehicles that you *own*
foreach ( $thisVehicleFile in $saveGameVehicles ) {
	Select-Xml -Path $thisVehicleFile -XPath '/vehicles/vehicle' |
		ForEach-Object { 
			$thisModName = $_.Node.modName
			if ( !$thisModName ) {
				# Skipping Blank entries.  Usually part of the map.
				return
			}
			if ( $thisModName -match '^pdlc' ) {
				# Skipping DLC files
				return
			} 
			if ($modFileListType.ContainsKey($thisModName)) {
				$modFileListLoad[$thisModName] = $true
				$modFileListUsed[$thisModName] = $true
			} else {
				# Track used mods that don't exist in the mods folder.
				$badUses += $thisModName
			}
		}
}

if ( $badUses.length -gt 0 ) {
	Write-Host "$DANGER The follow mods are used (purchased vehicles), but do not exist in the mods folder"
	LogWrite("DANGER: The follow mods are used (purchased vehicles), but do not exist in the mods folder")
	$badUsesUnique = $badUses | Sort-Object | Get-Unique
	BothArrayIndent($badUsesUnique)
	BothOutput($sepLine)
}

if ( $badLoads.length -gt 0 ) {
	Write-Host "$WARNING The follow mods are loaded, but do not exist in the mods folder"
	LogWrite("WARNING: The follow mods are loaded, but do not exist in the mods folder")
	$badLoadsUnique = $badLoads | Sort-Object | Get-Unique
	BothArrayIndent($badLoadsUnique)
	BothOutput($sepLine)
}

$onlyLoad = @()
$neverUsed = @()

foreach ( $thisMod in $modFileListType.GetEnumerator() ) {
	$realModName = $thisMod.name
	if ( $thisMod.Value -eq "zip" ) {
		$realModName = -join($thisMod.name, ".zip")
	}
	if ( !$modFileListLoad[$thisMod.Name] ) {	
		$neverUsed += $realModName
	}
	if ( $modFileListLoad[$thisMod.Name] -And !$modFileListUsed[$thisMod.Name] ) {
		$onlyLoad += $realModName
	}	
}

if ( $neverUsed.length -gt 0 ) {
	Write-Host "$SUGGEST The follow mods are not loaded or purchased in any savegame."
	Write-Host "If you don't like them, perhaps you could free up some space by deleting them?"
	LogWrite("The following mods are neither loaded nor used in any savegame")
	$neverUsedUnique = $neverUsed | Sort-Object | Get-Unique
	BothArrayIndent($neverUsedUnique)
	BothOutput($sepLine)
}

if ( $onlyLoad.length -gt 0 -And $showonlyloaded ) {
	Write-Host "$SUGGEST The follow mods are loaded but not used."
	Write-Host "They could maybe be removed from your game.  HOWEVER - mods that are required by other mods"
	Write-Host "may also appear here, so be VERY, VERY careful"
	Write-Host "By definition, script only mods, vehicle addons, etc will appear here."
	LogWrite("The following mods are only loaded.  They *might* be unused.")
	$onlyLoadUnique = $onlyLoad | Sort-Object | Get-Unique
	BothArrayIndent($onlyLoadUnique)
	BothOutput($sepLine)
}

$today = Get-Date
LogWrite("Output created at: $today")




