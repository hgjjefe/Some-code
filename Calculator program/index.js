

const display = document.getElementById("display");
display.value = "|";
const result = document.getElementById("result");    // result is what you get after hitting EXE
const indicator = document.getElementById("indicator");
const indicator2 = document.getElementById("indicator2");

const sci_keys_list = document.querySelectorAll("#sci-keys>*");
const main_keys_list = document.querySelectorAll("#main-keys>*");


const STO_btn = document.getElementById("STO");
const RAD_btn = document.getElementById("RAD");
const SHIFT_btn = document.getElementById("SHIFT");
const ALPHA_btn = document.getElementById("ALPHA");
const FMLA_btn = document.getElementById("FMLA");

const sin_btn = document.getElementById("sin")

result.value = "";
let cursorPos = 0;

let ans = 0;
let A = 0, B = 0, C = 0, D = 0, M = 0, X = 0, Y = 0, Z = 0;
let result_array = [];  // stores results from built-in formulas

let rad_mode = true;
let formula_mode = 0;

const GRAVITY = 9.81;
const PHI = 1.618033988749895;
const precision = 12;   // rounding precision (number of decimal places)


// operators that will make the searcher in factorialInputrGetter stop going left 
const OPERATORS = ["+", "-", "*", "/", "%", "⌊", "𝐂", "𝐏"];
const PLUSMINUS = ["+", "-"];

/* order of operations:
1st: ^
2nd: !
3rd: 𝐂, 𝐏
4th: * / % ⌊
5th: + -
*/


// data.expr stores stuff displayed as an array
// data.formula stores stuff as Javascript formula to be evaluated by eval()
let data = {
    expr: ["|"],     
    formula : ["|"]
}

// helper function to insert char at cursorPos within string
function insertChar(str, characterToInsert, index){
    return str.slice(0, index) + characterToInsert + str.slice(index);
}
function roundToTwelve(num) {
    return +(Math.round(num + "e+12")  + "e-12");
}
function showDigits(num, digits){
    return Number(num.toFixed(digits));
}

// swap two elements of array at index A, index B
function swapElement(array, indexA, indexB){
    [array[indexA], array[indexB]] = [array[indexB], array[indexA]];
}
function printData(){
    console.log("data.expr:", data.expr);
    console.log("data.formula:", data.formula);
}
// SEARCH AN ARRAY and return a list of the indices that have keyword
function search( array, keyword){
    let search_result = [];
    new_array = Array.from(array);   // convert string (if any) to array

    new_array.forEach( (element, index) => {
        if (element == keyword ) search_result.push(index);
    })
    
    return search_result;
}
// Takes in an array that do plus one for all elements larger than j
function plusOne(array, j){
    for (let i=0; i<array.length; i++){
        if (array[i] >= j){
            array[i]++;
        }
    }
}
// plus n for all elements in array
function allPlus(array, n=1){
    for (let i=0; i<array.length; i++){
        array[i] += n;
    }
}

// toggle a boolean value
function toogleBool(input){
    if (input == true) return false;
    if (input == false) return true;
}


// DISABLE AND ENABLE BUTTONS
function disableBtns(){
    for (let i=4; i<24; i++){
        sci_keys_list[i].removeAttribute("onclick");
    }
    main_keys_list[8].removeAttribute("onclick");
    main_keys_list[9].removeAttribute("onclick");
    main_keys_list[13].removeAttribute("onclick");
    main_keys_list[14].removeAttribute("onclick");
    main_keys_list[16].removeAttribute("onclick");
    main_keys_list[17].removeAttribute("onclick");
    main_keys_list[18].removeAttribute("onclick");
}



// DISPLAY

function appendToDisplay(to_expr, to_formula = to_expr){
    // insert expr and formula into the data arrays using splice
    //  array.splice(index, how_many_to_delete, element1, element2, ...)
    data.expr.splice(cursorPos, 0, to_expr);
    data.formula.splice(cursorPos, 0, to_formula);
    cursorPos++;
    updateDisplay();
    printData();
}

function updateDisplay(){
    display.value = data.expr.join("");

    // deactivate STO button if activated
    if (STO_btn.classList.contains("activated-btn")){
        STO_btn.classList.remove("activated-btn");
    }
    // deactivate SHIFT button if activated
    if (SHIFT_btn.classList.contains("activated-btn")){
        deactivateShift();
    }

    if (formula_mode > 0){
        indicator.value = TITLES[formula_mode];  // set indicator to default title of that formula_mode
    }

}

function clearDisplay(){
    data.expr = ["|"];
    data.formula = ["|"];
    cursorPos = 0;
    result.value = "";
    indicator2.value = "";
    if (formula_mode == 0){
        indicator.value = "";
    }
    if ( formula_mode ==-1){
        deactivateFMLA();
    }
    if (formula_mode > 0){
        result_array = [];
        result_fraction_array = {  // for formula mode
            up: [null,null,null],
            down: [null,null,null]
        }
    }
    updateDisplay();
    printData();
}

function del(){
    if (cursorPos > 0){
    data.expr.splice(cursorPos-1, 1);
    data.formula.splice(cursorPos-1, 1);
    cursorPos--;
    }
    updateDisplay();
    printData();
}

function cursorLeft(){
    if (cursorPos > 0){
        swapElement(data.expr, cursorPos, cursorPos - 1);
        swapElement(data.formula, cursorPos, cursorPos - 1);
        cursorPos--;
    }
    updateDisplay();
    printData();
}
function cursorRight(){
    if (cursorPos < data.expr.length - 1){
        swapElement(data.expr, cursorPos, cursorPos + 1);
        swapElement(data.formula, cursorPos, cursorPos + 1);
        cursorPos++;
    }
    updateDisplay();
    printData();
}
function cursorLeftmost(){
    while (cursorPos > 0){
        cursorLeft();
    }
}
function cursorRightmost(){
    while (cursorPos < display.value.length - 1){
        cursorRight();
    }
}

// CALCULATE THE INPUT EXPRESSION 

function calculate(){
    deactivateShift();
    let formula_str = data.formula.join("");
    formula_str = formula_str.replace("|", "");  // get rid of | bar
    // choose formula screen

    if (formula_mode == -1){
        chooseFormula(formula_str);
        return;
    }

    // NORMAL CALCULATION
    // convert factorial into functional format:   n! => factorial(n)
    // convert str back into array because it is easier to work with
    // Also, in formula_array, each element only has one character
    let formula_array = Array.from(formula_str);
    let search_result = search(formula_array, "!");
    formula_str = factorialInputGetter(formula_array, search_result).join("");

    // combinations  ( n choose r )
    formula_array = Array.from(formula_str);
    search_result = search(formula_array, "𝐂");
    formula_str = combInputGetter(formula_array, search_result, "comb").join("");

    // permutations  ( n permute r )
    formula_array = Array.from(formula_str);
    search_result = search(formula_array, "𝐏");
    formula_str = combInputGetter(formula_array, search_result, "perm").join("");

    // floor division
    formula_array = Array.from(formula_str);
    search_result = search(formula_array, "⌊");
    formula_str = floordivInputGetter(formula_array, search_result).join("");
    
    // formula_mode modifier
    if (formula_mode > 0){
    formula_array = Array.from(formula_str);
    formula_str = getFormula(formula_array).join("");
    }

    // turn ^ into ** before processing
    formula_str = formula_str.replaceAll("^","**")

    console.log(formula_str);
    try{
        formula_str = eval(formula_str);
        //result.value = Math.round(output.value  * Math.pow(10,12)) / Math.pow(10,12); 

        if (formula_mode == 0){
        result.value = Number(formula_str.toFixed(precision));
        ans = Number(result.value);

        // if result uses e+ notation, show the power on indicator (otherwise it overflows off screen)
        if (result.value > 10**21){
            indicator2.value = `e+${Math.floor(Math.log10(result.value))}`;
        }else{
            indicator2.value =  "";
        }
        // FORMULA MODE
        }else if (formula_mode > 0){ 
            for (let i=0; i<formula_str.length; i++){
            result_array[i] = Number(formula_str[i].toFixed(precision));
            }
            if(result_array[0])  X = result_array[0];
            if(result_array[1])  Y = result_array[1];
            if(result_array[2])  Z = result_array[2];
            showResult();
            console.log(result_array);
        }
    }
    catch(error){
        result.value = "Error";
        return "Error";
    }
    return ans;
}

function showResult(){   // for showing multiple results in formula mode
    result.value = "";
    for (let i=0; i<result_array.length; i++){
        result.value += `${showDigits(result_array[i],5)}, `;
    }
    result.value = result.value.slice(0,-2);  // get rid of trailing comma
}
function appendToResult(input, i){   // append a value (cor. to 5 d.p.) to result
    result.value += `${showDigits(result_array[i],5)}, `;
}

// store the answer inside variable A, B, C, ...
function store(variable){
    if (STO_btn.classList.contains("activated-btn")){
        if (variable == 'A') A = ans;
        if (variable == 'B') B = ans;
        if (variable == 'C') C = ans;
        if (variable == 'D') D = ans;
        if (variable == 'X') X = ans;
        if (variable == 'Y') Y = ans;
        if (variable == 'Z') Z = ans;
        if (variable == 'M') M = ans;
        STO_btn.classList.remove("activated-btn");
        indicator.value = ` ans -> ${variable}`;
    }
    else{
        appendToDisplay(variable);

    }
}

function Mplus(){
    if (STO_btn.classList.contains("activated-btn")){
        store('M');
    }else{
    let cal_result = calculate();
    if (cal_result == "Error") {
        indicator.value = `M = ${M}`;
        return;
    }
    M += ans;   
    indicator.value = `M = ${M}`;
    }
}
function Mminus(){
    if (STO_btn.classList.contains("activated-btn")){
        store('M');
        deactivateShift();
    }else{
    let cal_result = calculate();
    if (cal_result == "Error") {
        indicator.value = `M = ${M}`;
        return;
    }
    M -= ans;   
    indicator.value = `M = ${M}`;
    deactivateShift();
    }
}

// for toggleable buttons like STO, RAD, SHIFT, ALPHA
function activateBtn(btn){
    if (btn == "STO")
        STO_btn.classList.toggle("activated-btn");
    if (btn == "RAD"){
        if (rad_mode == true){
            RAD_btn.textContent = "deg";
            rad_mode = false;
        }
        else{
            RAD_btn.textContent = "rad";
            rad_mode = true;
        }
    }
    if (btn == "SHIFT"){
        if (formula_mode != -1){
        SHIFT_btn.classList.toggle("activated-btn");
        toggleShiftPanel();
        }
    }
    if (btn == "ALPHA"){    // toggle small font size
        ALPHA_btn.classList.toggle("activated-btn");
        if (ALPHA_btn.classList.contains("activated-btn")){
            display.style.fontSize = "1.2rem";
            result.style.fontSize = "1.2rem";
        }
            
        else{
            display.style.fontSize = "2rem";
            result.style.fontSize = "2rem";
        }
    }
    if (btn == "FMLA"){
        FMLA_btn.classList.toggle("activated-btn");
        deactivateShift();
        if (FMLA_btn.classList.contains("activated-btn")){  // choose formula
            clearDisplay();
            formula_mode = -1;
            indicator.value = "Formula No?"
            disableBtns();
        }
        else{
            deactivateFMLA();
        }
    }
}
function deactivateShift(){
    SHIFT_btn.classList.remove("activated-btn");
    toggleShiftPanel();
}
function deactivateFMLA(){
    FMLA_btn.classList.remove("activated-btn");
    formula_mode = 0;
    indicator.value = "";
    clearDisplay();
    deactivateShift();
}


// invoked when SHIFT is pressed
function toggleShiftPanel(){
    if (SHIFT_btn.classList.contains("activated-btn")){  // shift panel
        sci_keys_list[4].innerHTML = "n<sup>-1</sup>";
        sci_keys_list[4].setAttribute("onclick", "appendToDisplay('⁻¹', '^-1')");
        sci_keys_list[4].classList.remove("larger-text");

        sci_keys_list[5].innerHTML = "φ";
        sci_keys_list[5].setAttribute("onclick", "appendToDisplay('φ', 'PHI')");
        sci_keys_list[5].classList.remove("larger-text");

        sci_keys_list[6].textContent = "ab/c";
        sci_keys_list[6].setAttribute("onclick", "showMixedFraction()");

        sci_keys_list[7].innerHTML = "<sup>3</sup>√";
        sci_keys_list[7].setAttribute("onclick", "appendToDisplay('³√(', 'cubert(')");

        sci_keys_list[8].innerHTML = "n<sup>3</sup>";
        sci_keys_list[8].setAttribute("onclick", "appendToDisplay('³', '^3')");

        sci_keys_list[9].innerHTML = "<sup>n</sup>√";
        sci_keys_list[9].setAttribute("onclick", "appendToDisplay('ⁿ√(', 'mysqrt(')");

        sci_keys_list[10].innerHTML = "<sub>E</sub>";
        sci_keys_list[10].setAttribute("onclick", "appendToDisplay('ᴱ', '10^')");

        sci_keys_list[11].innerHTML = "exp";
        sci_keys_list[11].setAttribute("onclick", "appendToDisplay('exp(', 'Math.exp(')");

        sci_keys_list[12].innerHTML = "X";
        sci_keys_list[12].setAttribute("onclick", "store('X')");

        sci_keys_list[13].innerHTML = "Y";
        sci_keys_list[13].setAttribute("onclick", "store('Y')");

        sci_keys_list[14].innerHTML = "Z";
        sci_keys_list[14].setAttribute("onclick", "store('Z')");

        sci_keys_list[15].textContent = "asin";
        sci_keys_list[15].setAttribute("onclick", "appendToDisplay('asin(', 'inv_trigo(Math.asin,')");

        sci_keys_list[16].textContent = "acos";
        sci_keys_list[16].setAttribute("onclick", "appendToDisplay('acos(', 'inv_trigo(Math.acos,')");

        sci_keys_list[17].textContent = "atan";
        sci_keys_list[17].setAttribute("onclick", "appendToDisplay('atan(', 'inv_trigo(Math.atan,')");

        sci_keys_list[19].innerHTML = "M";
        sci_keys_list[19].setAttribute("onclick", "store('M')");

        sci_keys_list[20].textContent = "⌊n⌋";
        sci_keys_list[20].setAttribute("onclick", "appendToDisplay('flr(', 'Math.floor(')");

        sci_keys_list[21].textContent = "⌈n⌉";
        sci_keys_list[21].setAttribute("onclick", "appendToDisplay('ceil(', 'Math.ceil(')");

        sci_keys_list[23].textContent = "M-";
        sci_keys_list[23].setAttribute("onclick", "Mminus()");

        // SHIFT PANEL MAIN KEYS

        main_keys_list[0].textContent = "dist";
        main_keys_list[0].setAttribute("onclick", "appendToDisplay('dist(', 'dist(')");
        main_keys_list[0].classList.add("smaller-text");

        main_keys_list[11].textContent = "LoC";   // Law of Cosines
        main_keys_list[11].setAttribute("onclick", "appendToDisplay('LoC(', 'cosinelaw(')");
        main_keys_list[11].classList.add("smaller-text");

        main_keys_list[12].textContent = "Hrn";
        main_keys_list[12].setAttribute("onclick", "appendToDisplay('Hrn(', 'heron(')");
        main_keys_list[12].classList.add("smaller-text");

        main_keys_list[5].textContent = "LoC2";   // Law of Cosines
        main_keys_list[5].setAttribute("onclick", "appendToDisplay('LoC2(', 'cosinelaw2(')");
        main_keys_list[5].classList.add("smaller-text");

        main_keys_list[9].textContent = "//";
        main_keys_list[9].setAttribute("onclick", "appendToDisplay('//', '⌊')");

        main_keys_list[8].textContent = "%";
        main_keys_list[8].setAttribute("onclick", "appendToDisplay('%')");

        main_keys_list[8].textContent = "%";
        main_keys_list[8].setAttribute("onclick", "appendToDisplay('%')");

        main_keys_list[13].textContent = "nPr";
        main_keys_list[13].setAttribute("onclick", "appendToDisplay('𝐏', '𝐏')");
        main_keys_list[13].classList.add("smaller-text");

        main_keys_list[14].textContent = "nCr";
        main_keys_list[14].setAttribute("onclick", "appendToDisplay('𝐂', '𝐂')");
        main_keys_list[14].classList.add("smaller-text");

        main_keys_list[17].textContent = "g";
        main_keys_list[17].setAttribute("onclick", "appendToDisplay('g', 'GRAVITY')");
    }
    else{   // normal panel
        sci_keys_list[4].textContent = "!";
        sci_keys_list[4].setAttribute("onclick", "appendToDisplay('!')");
        sci_keys_list[4].classList.add("larger-text");

        sci_keys_list[5].textContent = "e";
        sci_keys_list[5].setAttribute("onclick", "appendToDisplay('e', 'Math.E')");
        sci_keys_list[5].classList.add("larger-text");

        sci_keys_list[6].textContent = "b/c";
        sci_keys_list[6].setAttribute("onclick", "convertToFraction()");

        sci_keys_list[7].textContent = "√";
        sci_keys_list[7].setAttribute("onclick", "appendToDisplay('√(', 'Math.sqrt(')");

        sci_keys_list[8].innerHTML = "n<sup>2</sup>";
        sci_keys_list[8].setAttribute("onclick", "appendToDisplay('²', '^2')");

        sci_keys_list[9].innerHTML = "^";
        sci_keys_list[9].setAttribute("onclick", "appendToDisplay('^', '^')");

        sci_keys_list[10].innerHTML = "log";
        sci_keys_list[10].setAttribute("onclick", "appendToDisplay('log(', 'mylog(')");

        sci_keys_list[11].innerHTML = "ln";
        sci_keys_list[11].setAttribute("onclick", "appendToDisplay('ln(', 'Math.log(')");

        sci_keys_list[12].innerHTML = "A";
        sci_keys_list[12].setAttribute("onclick", "store('A')");

        sci_keys_list[13].innerHTML = "B";
        sci_keys_list[13].setAttribute("onclick", "store('B')");

        sci_keys_list[14].innerHTML = "C";
        sci_keys_list[14].setAttribute("onclick", "store('C')");

        sci_keys_list[15].textContent = "sin";
        sci_keys_list[15].setAttribute("onclick", "appendToDisplay('sin(', 'trigo(Math.sin,')");

        sci_keys_list[16].textContent = "cos";
        sci_keys_list[16].setAttribute("onclick", "appendToDisplay('cos(', 'trigo(Math.cos,')");

        sci_keys_list[17].textContent = "tan";
        sci_keys_list[17].setAttribute("onclick", "appendToDisplay('tan(', 'trigo(Math.tan,')");

        sci_keys_list[18].innerHTML = "STO";
        sci_keys_list[18].setAttribute("onclick", "activateBtn('STO')");

        sci_keys_list[19].innerHTML = "D";
        sci_keys_list[19].setAttribute("onclick", "store('D')");

        sci_keys_list[20].textContent = "(";
        sci_keys_list[20].setAttribute("onclick", "appendToDisplay('(')");

        sci_keys_list[21].textContent = ")";
        sci_keys_list[21].setAttribute("onclick", "appendToDisplay(')')");

        sci_keys_list[22].textContent = ",";
        sci_keys_list[22].setAttribute("onclick", "appendToDisplay(',')");

        sci_keys_list[23].textContent = "M+";
        sci_keys_list[23].setAttribute("onclick", "Mplus()");

        // NORMAL PANEL MAIN KEYS

        main_keys_list[0].textContent = "7";
        main_keys_list[0].setAttribute("onclick", "appendToDisplay('7')");
        main_keys_list[0].classList.remove("smaller-text");

        main_keys_list[5].textContent = "4";
        main_keys_list[5].setAttribute("onclick", "appendToDisplay('4')");
        main_keys_list[5].classList.remove("smaller-text");

        main_keys_list[8].textContent = "×";
        main_keys_list[8].setAttribute("onclick", "appendToDisplay('×', '*')");

        main_keys_list[9].textContent = "÷";
        main_keys_list[9].setAttribute("onclick", "appendToDisplay('÷', '/')");

        main_keys_list[11].textContent = "2";
        main_keys_list[11].setAttribute("onclick", "appendToDisplay('2')");
        main_keys_list[11].classList.remove("smaller-text");

        main_keys_list[12].textContent = "3";
        main_keys_list[12].setAttribute("onclick", "appendToDisplay('3')");
        main_keys_list[12].classList.remove("smaller-text");

        main_keys_list[13].textContent = "+";
        main_keys_list[13].setAttribute("onclick", "appendToDisplay('+')");
        main_keys_list[13].classList.remove("smaller-text");

        main_keys_list[14].textContent = "–";
        main_keys_list[14].setAttribute("onclick", "appendToDisplay('-')");
        main_keys_list[14].classList.remove("smaller-text");

        main_keys_list[17].textContent = "π";
        main_keys_list[17].setAttribute("onclick", "appendToDisplay('π', 'Math.PI')");
    }
    
}

// GET FORMULAS

function chooseFormula(formula_str){
    if (formula_str > 10 || formula_str <= 0){
        result.value = "Invalid No.";
    }else{
        deactivateFMLA();
        formula_mode = Number(formula_str);
        indicator.value = TITLES[formula_mode];
    }
}
const TITLES = ["",   // formula_mode 0 is blank
    "1. Quadratic Formula",
    "2. SSS Triangle to AAA",
    "3. Angbi, Median, Altitude",
    "4. Simultaneous Equations",
    "5. Cubic Formula",
]

function getFormula(formula){   // formula is an array
    if (formula_mode == 0) return formula;
    formula.push(")");    // closing bracket that wraps the whole expression
    switch (formula_mode){
        case 1:
            formula.unshift("quadratic(");
            break;
        case 2:
            formula.unshift("SSStriangle(");
            break;
        case 3:
            formula.unshift("angmedalt(");
            break;
        case 4:
            formula.unshift("simult(");
            break;
        case 5:
            formula.unshift("cubic2(");
            break;
    }
    return formula;
}



// BUILT-IN FORMULAS OF CALCULATOR
// To use a built-in formula, go to formula mode and separate the arguments with commas, then hit EXE

// 1. Quadratic formula:  ax^2 + bx + c = 0
// IN: a,b,c   OUT: x1, x2
function quadratic(a,b,c){   
    let determinant = b**2 - 4*a*c;
    return [(-b + Math.sqrt(determinant)) / (2*a) , (-b - Math.sqrt(determinant)) / (2*a)]
}
// 2. Cosine law 2 but output three angles
// IN: a,b,c (sides)    OUT: A, B, C (opposite angles)
function SSStriangle(a,b,c){
    angA = Math.acos( (b**2 + c**2 - a**2) / (2*b*c) );
    angB = Math.acos( (a**2 + c**2 - b**2) / (2*a*c) );
    angC = Math.acos( (a**2 + b**2 - c**2) / (2*a*b) );
    if (rad_mode){
        return [angA, angB, angC];
    }
    else{
        return [angA*180/Math.PI, angB*180/Math.PI, angC*180/Math.PI];
    }
}
// 3. Angle bisector, Median, Altitude  (See Toddler Geometry Part IV)
// IN: a,b,c (sides)    OUT: length of angle bisector, median, altitude from vertex A to side a
function angmedalt(a,b,c){
    ang_bisector = Math.sqrt(b*c*(1- a**2/(b+c)**2) );
    median = Math.sqrt(2*b**2 + 2*c**2 - a**2)/2;
    altitude = Math.sqrt(b**2 - ((a**2+b**2-c**2)/(2*a))**2 );
    return [ang_bisector, median, altitude];
}

// 4. Linear simultaneous equation in two unknowns
// IN: A,B,C,D,E,F       _( Ax + By = C 
// OUT: x, y              ( Dx + Ey = F
function simult(a,b,c,d,e,f){
    return [ (c*e-b*f) / (a*e-b*d), (a*f-c*d) / (a*e-b*d) ];
}

// 5. Cubic formula: ax^3 + bx^2 + cx + d = 0
// IN: a,b,c,d    OUT: x1, x2, x3
function cubic(a,b,c,d){       // from calculator program
    let ans = 0;
    let e = 0
    b = -b / (3*a);
    d += b*c;
    c = c / a;
    d = b**3 - d / (2*a);
    e = b**2 - c / 3;
    ans = b**2 - c/3;
    ans = d**2 - ans**3;
    if (0>ans){
        ans = 2* Math.sqrt(e) * Math.cos(1/3*Math.acos(d/Math.sqrt(e**3)  )   );
    }else{
        d += ans;
        ans = d**(1/3) + (d-2*ans)**(1/3);
    }
    a = ans + b;
    let x1 = a;
    ans = ans + b;
    d = 3*b - ans;
    b = d / 2 + Math.sqrt(Math.abs(a*d-c+d**2/4));
    d -= b;
    let x2 = b;
    let x3 = d;
    return [x1, x2, x3];
}

function cubic2(a,b,c,d){
    let p = c/a - b**2/(3*a**2);
    let q = 2*b**3/(27*a**3) - b*c/(3*a**2) + d/a;
    let real_part = -q/2;          // original real and imaginary part
    let im_part_sq = q**2/4 + p**3/27;
    
    let im_part = Math.sqrt(Math.abs(im_part_sq));
    let r = Math.sqrt( real_part**2 + im_part**2 );  // magnitude of polar form 
    let x1 = 0, x2 = 0, x3 = 0;
    let R, I;   // real and imaginary part after dividing angle by three
    if (im_part_sq <= 0 + 10**(-12)){
        let theta = Math.acos(real_part/r)/3;  // divide angle by three
        R = r**(1/3) * Math.cos(theta);   // get real part*2
        I = r**(1/3) * Math.sin(theta);
        x1 = 2 * R;
        x2 = - R + Math.sqrt(3) * I;
        x3 = - R - Math.sqrt(3) * I;
    }else{
        x1 = (real_part + Math.sqrt(im_part_sq))**(1/3);
        x2 = NaN;
        x3 = NaN;
    }
    return [x1 - b/(3*a) , x2 - b/(3*a) , x3 - b/(3*a)];
}


// FOR MATH FUNCTIONS (which has a single output)

// custom Math.log
function mylog(base, input){
    if (arguments.length >= 2)
        return Math.log(input) / Math.log(base);
    else
        return Math.log10(base);
}


function mysqrt(nth_root, input){         // mysqrt(3,8) = 2
    if (arguments.length >= 2)
        return input ** (1/nth_root);
    else     // if only one input, nth_root becomes input
        return Math.sqrt(nth_root);
}
// cube root
function cubert(input){
    return mysqrt(3, input);
}
// distance formula
function dist(a,b,c=0){
    return Math.sqrt(a**2 + b**2 + c**2);
}
// Heron's formula
function heron(a,b,c){
    let s = (a+b+c)/2;
    return Math.sqrt( s*(s-a)*(s-b)*(s-c) );
}
// Law of cosines
function cosinelaw(a, b, theta){
    if (rad_mode)
        return Math.sqrt( a**2 + b**2 - 2*a*b*Math.cos(theta));
    else
        return Math.sqrt( a**2 + b**2 - 2*a*b*Math.cos(theta*Math.PI/180));
}
// second version where SSS is known, returns value of angle btw sides a, b
function cosinelaw2(a,b,c){   
    if (rad_mode)
        return Math.acos( (a**2 + b**2 - c**2) / (2*a*b) );
    else
        return Math.acos( (a**2 + b**2 - c**2) / (2*a*b) ) * 180 / Math.PI;
}


// TRIGONOMETRIC FUNCTION
function trigo(callback, angle){
    if (!rad_mode){
        angle = angle * Math.PI/180;
    }
    return callback(angle);
}
function inv_trigo(callback, value){
    let angle = callback(value);

    if (!rad_mode){
        angle = angle * 180/Math.PI;
    }

    return angle;
}


// FLOOR DIVISION input getter
function floordivInputGetter(formula, search_result){

    for (let i = 0; i< search_result.length; i++){
        let floordiv_index = search_result[i];  

        // j go left
        let parentheses_count = 0;
        let j = floordiv_index - 1;  // j is a searcher that will keep decrementing by 1 until search is finished
        while( j >= 0 ){       
            if( formula[j] == "(") parentheses_count--;
            if( formula[j] == ")") parentheses_count++;

            if( PLUSMINUS.includes(formula[j]) && parentheses_count <= 0 ) break;
            if (parentheses_count < 0) break    
            j--;
        }
        // put the elements between index j and factorial_index inside the bracket "factorial( )"
        formula[floordiv_index] = ",";   // replace "⌊" with ","
        formula.splice(j+1, 0, "floordiv", "(");
        // this will make the formula array length increase by two
        floordiv_index += 2;  // index of floor_div shifted right by 2 after insertion of "floordiv" and "("

        // j go right
        parentheses_count = 0;
        j = floordiv_index + 1;   
        while( j < formula.length ){       
            if( formula[j] == "(") parentheses_count++;
            if( formula[j] == ")") parentheses_count--;

            if (j == floordiv_index + 1){  // + or - at the immediate right of floordiv is excepted
                if( OPERATORS.includes(formula[j]) && parentheses_count <= 0 && formula[j] != "+" && formula[j] != "-" ) break;
            }else{
                if( OPERATORS.includes(formula[j]) && parentheses_count <= 0 ) break;
            }
            if (parentheses_count < 0) break    
            j++;
        }
        formula.splice(j, 0, ")");
        allPlus(search_result, 2);
        plusOne(search_result, j);
    }
    return formula;
}

// FLOOR DIVISION FUNCTION     // symbol: ⌊
function floordiv(x, y){   //  x f y   
    let quotient = x / y;
    quotient = Number(quotient.toFixed(8));
    return Math.floor(quotient);
}


// FACTORIAL Input GETTER
function factorialInputGetter(formula, search_result){

    for (let i = 0; i< search_result.length; i++){
        let factorial_index = search_result[i] + i*2;   // i is a shift variable
        let parentheses_count = 0;
        let j = factorial_index - 1;  // j is a searcher that will keep decrementing by 1 until search is finished

        while( j >= 0 ){       
            if( formula[j] == "(") parentheses_count--;
            if( formula[j] == ")") parentheses_count++;

            if( OPERATORS.includes(formula[j]) && parentheses_count <= 0 ) break;
            if (parentheses_count < 0) break    
            j--;
        }
        // put the elements between index j and factorial_index inside the bracket "factorial( )"
        formula[factorial_index] = ")";   // replace "!" with ")"
        formula.splice(j+1, 0, "factorial", "(");
        // this will make the formula array length increase by two
    }
    return formula;
}


// FACTORIAL FUNCTION
function factorial(number){
    if (number % 1 != 0) return gamma(number + 1);

    if (number === 0 || number === 1 ) return 1;

    let result = 1;
    for (let i = 1; i <= number; i++){
        result *= i;
        if(result === Infinity) return Infinity;
    }
    return result;
}


// GAMMA FUNCTINON
function gamma(n) {  // accurate to about 15 decimal places
    //some magic constants 
    var g = 7, // g represents the precision desired, p is the values of p[i] to plug into Lanczos' formula
        p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if(n < 0.5) {
      return Math.PI / Math.sin(n * Math.PI) / gamma(1 - n);
    }
    else {
      n--;
      var x = p[0];
      for(var i = 1; i < g + 2; i++) {
        x += p[i] / (n + i);
      }
      var t = n + g + 0.5;
      return Math.sqrt(2 * Math.PI) * Math.pow(t, (n + 0.5)) * Math.exp(-t) * x;
    }
}

function comb(n, r){
    let up = 1, down = 1;
    for (let i=n; i>n-r; i--){
        up *= i;
    }
    for (let i=1; i<=r; i++){
        down *= i;
    }
    return up / down;
}

function perm(n, r){
    let result = 1;
    for (let i=n; i>n-r; i--){
        result *= i;
    }
    return result;
}

function combInputGetter(formula, search_result, comb_or_perm = "comb"){

    for (let i = 0; i< search_result.length; i++){
        let floordiv_index = search_result[i];   // i is a shift variable

        // j go left
        let parentheses_count = 0;
        let j = floordiv_index - 1;  // j is a searcher that will keep decrementing by 1 until search is finished
        while( j >= 0 ){       
            if( formula[j] == "(") parentheses_count--;
            if( formula[j] == ")") parentheses_count++;

            if( OPERATORS.includes(formula[j]) && parentheses_count <= 0 ) break;
            if (parentheses_count < 0) break    
            j--;
        }
        // put the elements between index j and factorial_index inside the bracket "comb( )"
        formula[floordiv_index] = ",";   // replace "⌊" with ","
        formula.splice(j+1, 0, comb_or_perm, "(");
        // this will make the formula array length increase by two
        floordiv_index += 2;  // index of floor_div shifted right by 2 after insertion of "floordiv" and "("

        // j go right
        parentheses_count = 0;
        j = floordiv_index + 1;   
        while( j < formula.length ){       
            if( formula[j] == "(") parentheses_count++;
            if( formula[j] == ")") parentheses_count--;

            if( OPERATORS.includes(formula[j]) && parentheses_count <= 0 ) break;
            if (parentheses_count < 0) break    
            j++;
        }
        formula.splice(j, 0, ")");
        allPlus(search_result, 2);
        plusOne(search_result, j);
    }
    return formula;
}


// object to store the result as a fraction
let result_fraction = {
    up: 0,
    down: 1
}
let result_fraction_array = {  // for formula mode
    up: [null,null,null],
    down: [null,null,null]
}

function convertToFraction(){
    if (formula_mode == 0){   // normal mode
    if (result.value == "") return;
    if (result.value % 1 == 0) return;
    if (result.value.includes("/") ){
        result.value = ans;
        return;
    }

    for (let i=2;i<100001;i++){
        let up = result.value * i;
        up =  Number(up.toFixed(8));
        if (up % 1 == 0){
            result_fraction.up = up;    // store it in result_fraction
            result_fraction.down = i;
            result.value = `${up} / ${i}`;  
            break;
        }
    }
    return;
    }
    // formula mode > 0
    if (formula_mode > 0){
        if (result.value == "") return;
        if (result.value.includes("/") ){
            showResult();
            return;
        }
    result.value = "";
    for (let j=0; j<result_array.length; j++){
        if (result_array[j] % 1 == 0){    // if it is integer value, then set up, down to 1
            result_fraction_array.up[j] = result_array[j];   
            result_fraction_array.down[j] = 1;
            result.value += `${result_array[j]}, `;   // and append the value unchanged
            continue;
        }
        let i=2;
        for (i=2;i<100001;i++){
            let up = result_array[j] * i;
            up =  Number(up.toFixed(8));
            if (up % 1 == 0){
                result_fraction_array.up[j] = up;    // store it in result_fraction
                result_fraction_array.down[j] = i;
                result.value += `${up}/${i}, `;  
                break;
            }
        }
        
        if (i>100000){   // cant convert to fractions
            appendToResult(result_array[j], j);   // append decimals instead
        }    
    }
    result.value = result.value.slice(0,-2);
    console.log("frac_arr:", result_fraction_array);
    }
}

function showMixedFraction(){
    if (formula_mode == 0){
        if (result.value % 1 == 0){
            deactivateShift();
            return;
        }
        if (result.value.includes("/") ){  // in either fraction mode
                if (result.value.includes("ᒽ")){  // in mixed fraction mode
                    result.value = `${result_fraction.up} / ${result_fraction.down}`;
                }else{  // in improper fraction mode
                    result.value = MixedFraction(result_fraction.up, result_fraction.down);
                }
        }else{  // not in fraction mode
            convertToFraction();
            result.value = MixedFraction(result_fraction.up, result_fraction.down);
        }
        deactivateShift();
        return;
    }
    if (formula_mode > 0){
        if (result.value == "") return;
        let mode = 0;
        if (result.value.includes("/")){
            if (result.value.includes("ᒽ") ) mode = 2;  // mixed_fraction_mode
            else mode = 1;  // improper_fraction_mode
        }else mode = 0   // non-fraction mode

        console.log("result:", result.value);   
        if (mode == 2){
            showResult();
            convertToFraction();
            console.log("result2:", result.value);   
        }
        if (mode == 0 || mode == 1){
            result.value = ""
            console.log("result01:", result.value);   
            for (let j=0;j<result_array.length;j++){
                if (result_fraction_array.down[j] == 1){
                    result.value += `${result_fraction_array.up[j]}, `;
                }else{
                    result.value += MixedFraction(result_fraction_array.up[j], result_fraction_array.down[j]) + ", ";
                }

            }
            result.value = result.value.slice(0,-2);
        }
        deactivateShift();
    }
}



function MixedFraction(up, down){ // inputs numerator, denominator, outputs mixed fraction string
    if (down == 0) return "NaN";
    if (down == 1) return `${up}`;
    let sign = "ᒽ";
    let firstsign = ( up > 0 ) ? "": "-";
    let integral_part = floordiv(Math.abs(up), down);
    up = Math.abs(up) % down;

    if (formula_mode == 0)
        if (integral_part)
            return `${firstsign}${integral_part} ${sign} ${up} / ${down}`;
        else
            return `${firstsign}${up} / ${down}`;
    if (formula_mode > 0)
        if (integral_part)
            return `${firstsign}${integral_part}${sign}${up}/${down}`;
        else
            return `${firstsign}${up}/${down}`;
}


