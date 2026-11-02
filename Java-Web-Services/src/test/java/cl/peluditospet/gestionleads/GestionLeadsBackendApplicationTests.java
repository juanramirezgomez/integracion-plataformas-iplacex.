package cl.peluditospet.gestionleads;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {"spring.datasource.url=jdbc:h2:mem:prueba_contexto;DB_CLOSE_DELAY=-1"})
class GestionLeadsBackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
