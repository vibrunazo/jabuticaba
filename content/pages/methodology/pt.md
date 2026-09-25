---
translationStatus: "original"
title: "Como medimos o quão brasileira uma coisa é"
summary: "A metodologia completa do Índice Jabuticaba®: critérios, fórmula, incerteza e fontes. Reprodutível por qualquer pessoa com um computador e paciência."
updated: "2026-09-25"
---

## O que o índice mede

O Índice Jabuticaba® responde a uma única pergunta: **o quão rara, fora do Brasil, é uma coisa que os brasileiros consideram normal?**

- **0%**: comum no mundo inteiro, e nem mais comum nem mais intensa no Brasil.
- **100%**: exclusivamente brasileira; no exterior, só existe se for levada daqui.

O índice é **descritivo**. Mede raridade, não qualidade, importância ou dano. Quando uma jabuticaba é também um problema, isso aparece nos fatos e no texto, nunca na fórmula.

## Unidade de análise

Cada item tem uma **definição** precisa, e é a definição que recebe a nota, não o título. "Urnas eletrônicas" é uma coisa comum; "urnas de gravação eletrônica direta, sem registro impresso verificável pelo eleitor, usadas em todo o território nacional em eleições gerais" é outra, bem mais rara.

Quando a versão brasileira de algo é qualitativamente diferente das versões estrangeiras, a definição diz o que a torna diferente. As versões estrangeiras que não têm essa característica contam como ausentes.

As notas descrevem o **presente**, na data da última revisão de cada item.

## Exclusividade

A exclusividade vem da lista de lugares, fora do Brasil, onde a coisa existe: a mesma lista que desenha o mapa de cada item. Cada lugar é um código ISO 3166-1, então territórios com código próprio, como a Guiana Francesa, contam separadamente dos seus Estados soberanos.

Cada lugar recebe um nível de presença, e cada nível um peso:

| Nível | Peso | Significado |
|---|---|---|
| Ampla | {{WEIGHT_WIDESPREAD}} | Comum em escala nacional |
| Regional | {{WEIGHT_REGIONAL}} | Presente em parte do lugar, ou num nicho relevante |
| Marginal | {{WEIGHT_MARGINAL}} | Existe, mas é rara e difícil de encontrar |
| Ausente (verificado) | {{WEIGHT_ABSENT}} | Verificamos, e não existe |
| Sem dados | {{WEIGHT_ABSENT}} | Ainda não pesquisado; tratado como ausente |

"Ausente" e "sem dados" pesam o mesmo, mas não afirmam a mesma coisa. "Ausente" quer dizer que verificamos e temos a fonte; os mapas mostram a diferença.

### Exportações brasileiras

Quando algo existe num lugar **só porque o Brasil o exportou** (produtos, restaurantes, a diáspora), o peso daquele lugar é multiplicado por **{{EXPORT_WEIGHT_FACTOR}}**.

Exportações contam porque o índice existe para apontar coisas de que um brasileiro sentiria falta lá fora. Uma jabuticaba exportada continua brasileira, mas deixa de fazer falta. Num hipotético "índice da torta de maçã" de americanidade, o McDonald's teria nota baixa: é americano, mas está em toda parte, e nenhum americano no exterior sente sua falta. O guaraná, que lá fora só aparece em mercados de produtos brasileiros, quase não perde pontos. O açaí na tigela, vendido em cafés de meio mundo, perde muitos.

### Da contagem à exclusividade

A soma dos pesos é a **contagem ponderada de lugares**. A exclusividade vai de 1 (nenhum outro lugar) a 0 ({{SATURATION_PLACE_COUNT}} lugares ou mais), em escala logarítmica:

```
exclusividade = 1 − ln(1 + lugares) ÷ ln(1 + {{SATURATION_PLACE_COUNT}})
```

A escala é logarítmica porque a diferença entre nenhum e três outros países importa muito mais do que a diferença entre sessenta e sessenta e três. O primeiro lugar estrangeiro, sozinho, reduz a exclusividade em {{FIRST_PLACE_DROP_PERCENT}}%.

## Intensidade

A intensidade mede **o quanto a coisa é mais comum no Brasil** do que no lugar comparável onde ela é mais comum. É uma nota de 0 a 4. Quando existem dados, calculamos a razão de prevalência (prevalência no Brasil ÷ prevalência no lugar estrangeiro onde ela é maior) e a nota segue a faixa dessa razão:

| Nota | Significado | Razão de prevalência |
|---|---|---|
| 0 | Não é mais comum no Brasil | até {{RATIO_BAND_1}}× |
| 1 | Um pouco mais comum no Brasil | até {{RATIO_BAND_2}}× |
| 2 | Claramente mais comum | até {{RATIO_BAND_3}}× |
| 3 | Muito mais comum; o Brasil é o caso líder, com folga | até {{RATIO_BAND_4}}× |
| 4 | Esmagadoramente mais comum; lá fora, só vestígios | acima de {{RATIO_BAND_4}}× |

Diferenças de natureza não são intensidade: elas entram na definição. A nota 4 também é difícil de sustentar para algo presente em muitos lugares, e o sistema de validação alerta quando um item tem intensidade 4 e mais de {{INTENSITY_4_MAX_PLACE_COUNT}} lugares ponderados.

## A fórmula

```
raridade = E + {{MAX_INTENSITY_CREDIT}} × (I ÷ 4) × (1 − E)
índice   = arredondar(100 × raridade)
```

em que **E** é a exclusividade e **I** a intensidade.

- **A exclusividade domina.** Se nada parecido existe em outro lugar (E = 1), a raridade é máxima, qualquer que seja a intensidade.
- **A intensidade preenche parte do espaço restante.** Algo presente em toda parte, mas muito mais comum no Brasil, não é 0%: chega no máximo a {{UBIQUITOUS_MAX_SCORE}}%, e na prática a {{UBIQUITOUS_SCORE_AT_3}}%. Ser o maior não é o mesmo que ser o único.

Cada página de item mostra essa conta com os números do próprio item, na seção "Como chegamos a este número".

## Incerteza

Qualquer entrada pode ser uma faixa em vez de um valor: um lugar pode ter presença "entre marginal e regional", e a intensidade pode ser "entre 1 e 2". Como a fórmula só anda num sentido para cada entrada, duas contas dão os limites exatos:

- **mínimo**: com a maior contagem de lugares e a menor intensidade;
- **máximo**: com a menor contagem de lugares e a maior intensidade;
- **estimativa central**: com o ponto médio de cada faixa.

O resultado é publicado como **"62% (56–69%)"**. É uma **faixa de plausibilidade**, do pior ao melhor caso. Não é um intervalo de confiança estatístico, e não finge ser.

## Grau de evidência

Cada item recebe um grau de **A** a **D**, que diz o quão sólidas são as fontes por trás das entradas. O grau é calculado a partir dos tipos de fonte, nunca atribuído à mão, e **não altera o índice**.

| Força | Tipos de fonte |
|---|---|
| {{STRENGTH_STRONG}} | Dados estatísticos oficiais, documentos oficiais, trabalhos acadêmicos revisados por pares |
| {{STRENGTH_MEDIUM}} | Relatórios de organizações, obras de referência, imprensa |
| {{STRENGTH_WEAK}} | Blogs, fóruns, redes sociais |
| 0 | Sem fonte, ou avaliação editorial |

Cada entrada vale a força da sua melhor fonte. O grau vem da média: **A** a partir de {{GRADE_A}}, **B** a partir de {{GRADE_B}}, **C** a partir de {{GRADE_C}}, e **D** abaixo disso.

## O que não entra no cálculo

**Consciência** (0 a 4) registra o quanto os brasileiros sabem que aquilo é raro no exterior: de 0 ("tratado como universal") a 4 ("símbolo nacional justamente por ser brasileiro"). Não entra na fórmula, porque raridade não depende do que alguém acredita.

Itens com consciência de no máximo {{HIDDEN_MAX_AWARENESS}} e índice acima de {{HIDDEN_MIN_SCORE}}% recebem o selo **Jabuticaba oculta**: coisas bem brasileiras que quase ninguém percebe que são.

## Mapas

Os mapas usam dados do Natural Earth (domínio público), com territórios ultramarinos separados dos seus Estados soberanos. Áreas disputadas seguem a norma ISO 3166-1: a Crimeia aparece como parte da Ucrânia, Taiwan aparece separado da China, e o Chipre do Norte e a Somalilândia aparecem como parte de Chipre e da Somália.

Há duas projeções, ambas Equal Earth:

- **Soberana** (padrão): centrada em 60° O, com o sul para cima, como nos mapas-múndi do IBGE. Suas bordas caem em 120° L, o que corta a Rússia ao meio e deixa a China continental e Taiwan em lados opostos do mapa.
- **Colonial**: o mapa de sempre, centrado em Greenwich, com o norte para cima.

## Reprodutibilidade

Todos os dados, textos e o código do índice estão em [domínio público (CC0)](https://github.com/vibrunazo/jabuticaba/blob/master/LICENSE), no [repositório do projeto](https://github.com/vibrunazo/jabuticaba). Qualquer pessoa pode baixá-lo e recalcular todas as notas com um único comando (`pnpm index`), que não usa rede, modelos de linguagem nem números aleatórios. O resultado fica em [`data/index-results.csv`](https://github.com/vibrunazo/jabuticaba/blob/master/data/index-results.csv); toda mudança nos dados ou na fórmula aparece ali, linha por linha, no histórico do repositório.

## Histórico de versões

- **v0.2**: exportações brasileiras passam a contar com peso reduzido ({{EXPORT_WEIGHT_FACTOR}}×), em vez de peso zero.
- **v0.1**: primeira versão. Dois critérios pontuados (exclusividade e intensidade); consciência registrada, mas fora do cálculo; grau de evidência calculado a partir dos tipos de fonte.

A versão em vigor é a **v{{METHODOLOGY_VERSION}}**.
