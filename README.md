# 8-puzzle – képkirakó

Egy telepítés nélkül futtatható 8-puzzle játék HTML, CSS és JavaScript használatával. Egy teljes képet választasz ki, a JavaScript pedig automatikusan nyolc képrészletre bontja; a kilencedik mező üres marad.

## Indítás

1. Másold a teljes képeket az `images` mappába `1.jpg`, `2.jpg`, `3.jpg`... néven.
2. Nyisd meg az `index.html` fájlt egy böngészőben.

A játék automatikusan, sorrendben keresi a számozott képeket, és az első hiányzó fájlnál megáll. Új szint hozzáadásához töltsd fel a következő sorszámú JPG-t; a fájlneveket nem kell a kódban módosítani. A képek közvetlenül a fájlokból jelennek meg, ezért a játék internetkapcsolat nélkül is futtatható.

## Megoldott képek mentése

- A sikeresen kirakott képek automatikusan bekerülnek a játék alján található **Megoldott képek** gyűjteménybe.
- A gyűjteményben lévő bélyegképre kattintva a teljes kép nagy méretben megnyílik.
- A teljesített képek listája a böngésző `localStorage` tárhelyére mentődik, ezért ugyanabban a böngészőben, ugyanazon az eszközön az oldal újbóli megnyitásakor is megmarad.
- A képek teljesítését fájlnév alapján tárolja. Ha átnevezel vagy eltávolítasz egy képet a `PUZZLE_IMAGES` listából, a hozzá tartozó bejegyzés nem jelenik meg a gyűjteményben.
- A mentés nem szerverre történik, ezért másik böngészőben vagy eszközön nem szinkronizálódik. A böngésző webhelyadatainak törlése a mentett listát is törölheti.

## Képek feldarabolása

- Minden JPG egy teljes, egyben lévő képet tartalmazzon, ne előre feldarabolt képkockákat.
- A JavaScript a kép középső négyzet alakú részét használja, majd 3×3-as rácsra bontja. Négyzetes forrásképnél nincs levágás.
- A 3×3-as rács utolsó, jobb alsó mezője üres; a másik nyolc részlet kerül a táblára.
- A `9.jpg` fájlra nincs szükség.

## Játékmenet

- Kattints az üres mezővel szomszédos képrészletekre, vagy használd a nyílbillentyűket.
- Minden új szint a teljes, megoldott képet mutatja 5 másodpercig, majd egyszer automatikusan összekeveri 80 szabályos lépéssel. Így az állás mindig megoldható.
- A következő szint csak az előző kirakó teljesítése után nyílik meg.

A projekt nem használ külső könyvtárat vagy szervert; internetkapcsolat nélkül is működik.
