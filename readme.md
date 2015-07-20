1) взрывается када <space /> впихивается рядом с текстовыми переменными, типа:

```xml
<foo>
  <space />{bar}
</foo>
```

3 типа вставки контента:
1) nodeValue. текстовый контент

```xml
<foo>
  {bar}
</foo>
```
2) setAttribute. строка. здесь 2 варианта: 1 - когда значение полностью соответствует атрибуту и когда оно является его частью. во втором случае будет вставлен в атрибут результат обработки "item {selected}".replace('{selected}', selectedValue);

```xml
<foo>
  <a class="item {selected}" data-strange-val="bar{tar} {zip}" data-uid="{uid}"></a>
</foo>
```
3) html. здесь происходит создание дива, innerHTML ему и appendChild туда, где установлен placeholder

```xml
<foo>
  {bar|html}
</foo>
```

Сами шаблоны должны иметь имя - главный тег:

```xml
<foo> ... </foo>
```

Для переиспользования шаблонов, шаблоны разносятся по отдельным именованным тегам и вызывают друг друга по имени. параметрами можно передать связанные ключи - при срабатывании этого ключа сеттера у родителя, будет вызван каскадный сеттер чалду

```xml
<foo>
  {bar}
  <tar bar2="bar" />
</foo>
<tar>
  <a href="{bar2}"></a>
</tar>
```

### if
Для текстовых нод они не нужны - можно засеттить пустую строку и тогда будет достигнут ожидаемый эффект - нода исчезнет визуально из шаблона.
Для манипуляций и подшаблонами и тегами есть конструкция `<if true="foo">`, ``

```xml
<foo>
  {bar}
  <if true="{zip}">
    <b class="{rar}">{g}</b>
    <if any="[a, b, c]">
       <div>all z, y, x are true</div>
    </if>
    <elseif all="[z, y, x]">
      <div>all z, y, x are true</div>
    </elseif>
  </if>
  <elseif false="{zar}">
    <div>!zar</div>
  </elseif>
  <else>
    not zip and true zar
  </else>
  <a if="{gzip}" href="{tar}">{jar}</a>
</foo>
```

### import / export

```xml
<import name="ButtonMarked" from="app/Button/marked" />
<import name="{Marked}" from="app/Button/template" />
<export default="foo" Bar="" Rar="Zip" />
<foo export="default">
  <Head from="app/Head" />
</foo>
<Bar export="">
 ... 
</Bar>
<Rar export="Zip">
  ...
</Rar>
<Tar>
  ...
</Tar>
```
