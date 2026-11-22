# CSV Reader Speed

Candidata reconstruída para o desafio [CSV Reader Speed](https://make.fun/bounty/csv-reader-speed-01-run-20261121). Não se afirma que seja a implementação original perdida. A elegibilidade e a submissão oficial não estão confirmadas.

## Código e testes

- `solve.js` exporta `run(input)`; `main.ts` é o driver.
- `test-local.mjs` contém 27 testes manuais independentes com asserções. Para executá-los: `node --experimental-default-type=module test-local.mjs`.
- `grade-ours.json`, `fuzz-r1.json`, `bench-ours.json` e `bench-base.json` são registros históricos locais, não resultados oficiais de competição; seus scripts e corpus originais não foram recuperados.

## Validação local em 22/11/2026

Em Linux x64 com Node 22.23.5, os 27 testes manuais passaram. O driver e o scorer do kit oficial foram executados localmente, sem Docker: 6/6 casos de prática. Uma comparação com a referência do kit cobriu 11.562 entradas sem divergências. No mesmo ambiente não isolado, a média aparada de nove medições de CPU foi 490,975 ms para a candidata e 959,974 ms para o baseline. Não são resultados da avaliação final, nem garantem equivalência integral ou prêmio.

A fonte e autoria da candidata recuperada ainda precisam ser comprovadas. Não há licença escolhida neste repositório enquanto os direitos de licenciamento não forem esclarecidos.
