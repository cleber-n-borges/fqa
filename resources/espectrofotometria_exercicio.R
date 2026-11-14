
conc <- c(0.0,  2.5,  5.3,  7.2, 13.0 )

ab <- c( 0, 0.07058107, 0.15490196, 0.24412514, 0.48148606 )

plot(conc, ab,
     cex = 1.2,                    # pontos um pouco menores (mais discretos)
     pch = 19,
     col = "gray30",               # cinza escuro em vez de preto puro
     xlab = expression("Concentração" ~ (mg %.% kg^{-1})),
     ylab = expression("Absorbância" ~ (u.a.)),
     panel.first = grid(col = "gray90", lty = "dotted"),  # grade mais suave
     main = "Absorbância ~ Concentração",
     cex.main = 0.9,               # título menor
     font.main = 1,                # título sem negrito (mais discreto)
     cex.lab = 0.9,                # rótulos dos eixos menores
     cex.axis = 0.8,               # números dos eixos menores
     las = 1,                      # rótulos do eixo Y na horizontal (mais legível)
     bty = "l"                     # moldura apenas nos eixos X e Y (remove a caixa)
)


abline( coef( lm( ab~conc ) ), lwd=4, col=2 )





