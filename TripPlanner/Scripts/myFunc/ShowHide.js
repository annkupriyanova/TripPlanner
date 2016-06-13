function ShowOrHide(blockId) {
    var block = document.getElementById(blockId);
    if (block.style.display == "none")
    {
        block.style.display = "block"
    }
    else
    {
        if (block.style.display == "block")
        {
            block.style.display = "none"
        }
    }
}